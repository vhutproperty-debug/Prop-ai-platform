import type { BuilderCrawlConfig } from "@/config/builders";
import type { ExtractedProjectFacts } from "@/types/firecrawl-import";
import type { FirecrawlScrapeResult } from "@/services/firecrawl/firecrawl.service";
import {
  parseBuilderListingPage,
  parseProjectPage,
} from "@/services/extraction/parsers";

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
    });
  },

  extractFromProjectPage(
    scrape: FirecrawlScrapeResult,
    builder: BuilderCrawlConfig
  ): ExtractedProjectFacts {
    return parseProjectPage({
      url: scrape.url,
      markdown: scrape.markdown,
      html: scrape.html,
      metadata: scrape.metadata,
      builderName: builder.name,
      builderWebsite: builder.website,
    });
  },
};
