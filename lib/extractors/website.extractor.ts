import type { Extractor, ExtractorContext } from "@/lib/extractors/types";
import { websiteFactsSchema } from "@/validations/ingestion";

export const websiteExtractor: Extractor = {
  source: "builder_website",

  async extract(ctx: ExtractorContext) {
    ctx.logger.info("Extracting structured facts from builder website payload");
    const facts = websiteFactsSchema.parse(ctx.payload);

    return {
      source: this.source,
      raw: facts,
      logs: ctx.logger.getLogs(),
    };
  },
};
