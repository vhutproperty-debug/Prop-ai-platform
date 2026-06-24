import type { ImportSource } from "@/config/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import { normalizeWebsiteFacts } from "@/lib/normalizers/website.normalizer";
import { normalizePdfFacts } from "@/lib/normalizers/pdf.normalizer";
import { normalizeManualImport } from "@/lib/normalizers/manual.normalizer";
import { normalizeCsvGroup } from "@/lib/normalizers/csv.normalizer";
import { normalizeFirecrawlFacts } from "@/lib/normalizers/firecrawl.normalizer";
import type { CsvImportRow, ManualImportInput, WebsiteFactsInput } from "@/validations/ingestion";
import type { ExtractedProjectFacts } from "@/types/firecrawl-import";
import { stagedBundleSchema } from "@/validations/ingestion-bundle";

export function normalizeExtractedData(
  source: ImportSource,
  raw: unknown,
  logger: IngestionLogger
): NormalizedImportBundle[] {
  let bundles: NormalizedImportBundle[];

  switch (source) {
    case "builder_website":
      bundles = [normalizeWebsiteFacts(raw as WebsiteFactsInput, source, logger)];
      break;
    case "pdf_brochure":
      bundles = [normalizePdfFacts(raw as Parameters<typeof normalizePdfFacts>[0], source, logger)];
      break;
    case "manual":
      bundles = [normalizeManualImport(raw as ManualImportInput, source, logger)];
      break;
    case "csv": {
      const data = raw as { rows: CsvImportRow[]; groups: Record<string, CsvImportRow[]> };
      bundles = Object.values(data.groups).map((group) =>
        normalizeCsvGroup(group, source, logger)
      );
      break;
    }
    case "firecrawl":
      bundles = [normalizeFirecrawlFacts(raw as ExtractedProjectFacts, source, logger)];
      break;
    default:
      throw new Error(`Unsupported source for normalization: ${source}`);
  }

  return bundles.map((bundle) => {
    const result = stagedBundleSchema.safeParse(bundle);
    if (!result.success) {
      logger.error("Bundle validation failed after normalization", {
        slug: bundle.project.slug,
        errors: result.error.flatten(),
      });
      throw new Error(
        `Normalization validation failed for ${bundle.project.slug}: ${result.error.message}`
      );
    }
    return result.data;
  });
}
