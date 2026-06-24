import type { Extractor, ExtractorContext } from "@/lib/extractors/types";

/** Firecrawl extraction is handled by importJobsService — this is a passthrough for manual payloads */
export const firecrawlExtractor: Extractor = {
  source: "firecrawl",

  async extract(ctx: ExtractorContext) {
    ctx.logger.info("Firecrawl extractor received pre-scraped payload");
    return {
      source: this.source,
      raw: ctx.payload,
      logs: ctx.logger.getLogs(),
    };
  },
};
