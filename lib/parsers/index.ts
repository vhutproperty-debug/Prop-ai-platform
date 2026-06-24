import { z } from "zod";
import type { ImportSource } from "@/config/ingestion";
import {
  csvImportRowSchema,
  manualImportSchema,
  pdfBrochureFactsSchema,
  websiteFactsSchema,
} from "@/validations/ingestion";

const schemaMap = {
  builder_website: websiteFactsSchema,
  pdf_brochure: pdfBrochureFactsSchema,
  manual: manualImportSchema,
  csv: z.union([z.string(), z.array(csvImportRowSchema)]),
} as const;

export function parseSourcePayload(source: ImportSource, payload: unknown) {
  const schema = schemaMap[source];
  return schema.parse(payload);
}
