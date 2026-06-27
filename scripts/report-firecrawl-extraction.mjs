/**
 * Extraction audit for a builder project URL — prints field mapping report (no secrets).
 * Usage: node --require ./scripts/setup-dns.cjs ./node_modules/tsx/dist/cli.mjs scripts/report-firecrawl-extraction.mjs lodha [projectUrl]
 */
import { loadEnvFiles } from "../lib/env/load-env-file.ts";

loadEnvFiles();

const builderSlug = process.argv[2] ?? "lodha";
const inputUrl =
  process.argv[3] ??
  "https://www.lodhagroup.com/projects/residential-property-in-worli/lodha-park/gallery";

const { getBuilderConfig } = await import("../config/builders.ts");
const { isFirecrawlConfigured } = await import("../config/env.ts");
const { firecrawlService } = await import("../services/firecrawl/firecrawl.service.ts");
const { extractionService } = await import("../services/extraction/extraction.service.ts");
const { normalizationService } = await import("../services/normalization/normalization.service.ts");
const { resolveCanonicalProjectUrl } = await import(
  "../services/extraction/project-url.utils.ts"
);

if (!isFirecrawlConfigured) {
  console.error("FIRECRAWL_API_KEY is not configured");
  process.exit(1);
}

const builder = getBuilderConfig(builderSlug);
if (!builder) {
  console.error(`Unknown builder: ${builderSlug}`);
  process.exit(1);
}

const canonicalUrl = resolveCanonicalProjectUrl(inputUrl);
const scrape = await firecrawlService.scrapeUrl(canonicalUrl);
const extraction = extractionService.extractFromProjectPageWithReport(
  scrape,
  builder,
  inputUrl
);
const bundle = normalizationService.normalizeProject(
  extraction.facts,
  builder,
  canonicalUrl
);

console.log(
  JSON.stringify(
    {
      builder: builder.name,
      inputUrl,
      canonicalUrl,
      extractionReport: extraction.report,
      normalizedPreview: {
        projectName: bundle.project.projectName,
        slug: bundle.project.slug,
        location: bundle.location.name,
        reraNumber: bundle.project.reraNumber,
        priceRange: bundle.project.priceRange,
        configurationCount: bundle.project.configurations.length,
        configurations: bundle.project.configurations.map((c) => c.name),
        amenityCount: bundle.project.amenities.length,
        galleryCount: bundle.project.gallery.length,
        fieldsExtracted: bundle.metadata.fieldsExtracted,
      },
    },
    null,
    2
  )
);
