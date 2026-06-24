import { z } from "zod";
import type { ImportSource } from "@/config/ingestion";
import {
  csvImportRowSchema,
  manualImportSchema,
  pdfBrochureFactsSchema,
  websiteFactsSchema,
} from "@/validations/ingestion";

const schemaMap: Record<ImportSource, z.ZodType> = {
  builder_website: websiteFactsSchema,
  firecrawl: z.unknown(),
  pdf_brochure: pdfBrochureFactsSchema,
  manual: manualImportSchema,
  csv: z.union([z.string(), z.array(csvImportRowSchema)]),
};

export function parseSourcePayload(source: ImportSource, payload: unknown) {
  const schema = schemaMap[source];
  return schema.parse(payload);
}
