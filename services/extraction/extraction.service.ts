import type { BuilderCrawlConfig } from "@/config/builders";
import type {
  ExtractedProjectFacts,
  ProjectPageExtractionResult,
} from "@/types/firecrawl-import";
import type { FirecrawlScrapeResult } from "@/services/firecrawl/firecrawl.service";
import { resolveCanonicalProjectUrl } from "@/services/extraction/project-url.utils";
import {
  parseBuilderListingPage,
  parseProjectPage,
  parseProjectPageWithReport,
} from "@/services/extraction/parsers";

function buildProjectPageInput(
  scrape: FirecrawlScrapeResult,
  builder: BuilderCrawlConfig,
  url?: string
) {
  return {
    url: url ?? scrape.url,
    markdown: scrape.markdown,
    html: scrape.html,
    metadata: scrape.metadata,
    links: scrape.links,
    images: scrape.images,
    builderName: builder.name,
    builderWebsite: builder.website,
  };
}

export const extractionService = {
  extractFromListing(
    scrape: FirecrawlScrapeResult,
    builder: BuilderCrawlConfig
  ) {
    return parseBuilderListingPage({
      url: scrape.url,
      markdown: scrape.markdown,
      html: scrape.html,
      links: scrape.links,
      builderName: builder.name,
      builderWebsite: builder.website,
      projectLinkPattern: builder.projectLinkPattern,
      builderSlug: builder.slug,
    });
  },

  extractFromProjectPage(
    scrape: FirecrawlScrapeResult,
    builder: BuilderCrawlConfig,
    sourceUrl?: string
  ): ExtractedProjectFacts {
    return parseProjectPage(buildProjectPageInput(scrape, builder, sourceUrl));
  },

  extractFromProjectPageWithReport(
    scrape: FirecrawlScrapeResult,
    builder: BuilderCrawlConfig,
    sourceUrl?: string
  ): ProjectPageExtractionResult {
    return parseProjectPageWithReport(
      buildProjectPageInput(scrape, builder, sourceUrl)
    );
  },

  resolveCanonicalProjectUrl(url: string): string {
    return resolveCanonicalProjectUrl(url);
  },
};
