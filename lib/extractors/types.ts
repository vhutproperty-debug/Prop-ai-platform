import type { ImportSource } from "@/config/ingestion";
import type { ExtractionResult } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";

export interface ExtractorContext {
  source: ImportSource;
  payload: unknown;
  fileName?: string;
  sourceReference?: string;
  logger: IngestionLogger;
}

export interface Extractor {
  readonly source: ImportSource;
  extract(ctx: ExtractorContext): Promise<ExtractionResult>;
}
