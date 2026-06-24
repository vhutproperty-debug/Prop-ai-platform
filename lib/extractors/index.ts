import type { ImportSource } from "@/config/ingestion";
import type { Extractor } from "@/lib/extractors/types";
import { websiteExtractor } from "@/lib/extractors/website.extractor";
import { pdfExtractor } from "@/lib/extractors/pdf.extractor";
import { manualExtractor } from "@/lib/extractors/manual.extractor";
import { csvExtractor } from "@/lib/extractors/csv.extractor";
import { firecrawlExtractor } from "@/lib/extractors/firecrawl.extractor";

const extractorRegistry: Record<ImportSource, Extractor> = {
  builder_website: websiteExtractor,
  firecrawl: firecrawlExtractor,
  pdf_brochure: pdfExtractor,
  manual: manualExtractor,
  csv: csvExtractor,
};

export function getExtractor(source: ImportSource): Extractor {
  const extractor = extractorRegistry[source];
  if (!extractor) {
    throw new Error(`No extractor registered for source: ${source}`);
  }
  return extractor;
}

export {
  websiteExtractor,
  pdfExtractor,
  manualExtractor,
  csvExtractor,
};
