import type { Extractor, ExtractorContext } from "@/lib/extractors/types";
import { manualImportSchema } from "@/validations/ingestion";

export const manualExtractor: Extractor = {
  source: "manual",

  async extract(ctx: ExtractorContext) {
    ctx.logger.info("Processing manual structured import");
    const data = manualImportSchema.parse(ctx.payload);

    return {
      source: this.source,
      raw: data,
      logs: ctx.logger.getLogs(),
    };
  },
};
