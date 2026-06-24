import type { ImportSource } from "@/config/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import type { ExtractedProjectFacts } from "@/types/firecrawl-import";
import { normalizationService } from "@/services/normalization/normalization.service";
import { getBuilderConfig } from "@/config/builders";

export function normalizeFirecrawlFacts(
  raw: ExtractedProjectFacts & { builderSlug?: string },
  source: ImportSource,
  logger: IngestionLogger
): NormalizedImportBundle {
  const builderSlug = raw.builderSlug ?? raw.builderName.toLowerCase().replace(/\s+/g, "-");
  const builder = getBuilderConfig(builderSlug);

  if (!builder) {
    throw new Error(`No builder config for slug: ${builderSlug}`);
  }

  const bundle = normalizationService.normalizeProject(raw, builder, raw.sourceUrl);
  bundle.source = source;
  logger.info("Normalized firecrawl facts", { slug: bundle.project.slug });
  return bundle;
}
