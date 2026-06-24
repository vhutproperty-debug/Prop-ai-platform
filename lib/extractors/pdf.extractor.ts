import type { Extractor, ExtractorContext } from "@/lib/extractors/types";
import { parsePdfText } from "@/lib/parsers/pdf-text.parser";
import { pdfBrochureFactsSchema } from "@/validations/ingestion";

export const pdfExtractor: Extractor = {
  source: "pdf_brochure",

  async extract(ctx: ExtractorContext) {
    ctx.logger.info("Extracting factual data from PDF brochure text", {
      fileName: ctx.fileName,
    });

    const input = pdfBrochureFactsSchema.parse(ctx.payload);
    const facts = parsePdfText(input.text);

    if (input.builderName) facts.builderName = input.builderName;
    if (input.projectName) facts.projectName = input.projectName;

    ctx.logger.info("PDF factual extraction complete", {
      reraFound: Boolean(facts.reraNumber),
      configCount: facts.configurations.length,
      priceCount: facts.priceRanges.length,
    });

    return {
      source: this.source,
      raw: { ...input, extractedFacts: facts },
      logs: ctx.logger.getLogs(),
    };
  },
};
