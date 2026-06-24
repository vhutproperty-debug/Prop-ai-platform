import { runIngestionPipeline, type RunPipelineOptions } from "@/lib/importers/pipeline";
import { isDbConfigured } from "@/config/env";

export const ingestionService = {
  isAvailable: () => isDbConfigured,

  async ingest(options: RunPipelineOptions) {
    if (!isDbConfigured) {
      throw new Error("MongoDB is required for data ingestion");
    }
    return runIngestionPipeline(options);
  },
};
