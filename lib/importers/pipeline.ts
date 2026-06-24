import type { ImportSource } from "@/config/ingestion";
import type { PipelineResult } from "@/types/ingestion";
import { getExtractor } from "@/lib/extractors";
import { normalizeExtractedData } from "@/lib/normalizers";
import {
  detectDuplicates,
  resolveRecordStatus,
  classifyRecord,
} from "@/lib/importers/duplicate-detector";
import { createJobLogger } from "@/lib/ingestion/logger";
import { withDatabase } from "@/lib/db/with-database";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ingestionRequestSchema } from "@/validations/ingestion";

export interface RunPipelineOptions {
  source: ImportSource;
  payload: unknown;
  fileName?: string;
  sourceReference?: string;
  createdBy?: string;
}

export async function runIngestionPipeline(
  options: RunPipelineOptions
): Promise<PipelineResult> {
  const validated = ingestionRequestSchema.parse(options);
  const logger = createJobLogger(validated.source);

  const job = await withDatabase(() =>
    ImportJob.create({
      source: validated.source,
      status: "queued",
      fileName: validated.fileName,
      sourceReference: validated.sourceReference,
      createdBy: options.createdBy,
      logs: [],
    })
  );

  const jobId = String(job._id);
  logger.info("Import job created", { jobId });

  try {
    await updateJobStatus(jobId, "extracting", logger);

    const extractor = getExtractor(validated.source);
    const extraction = await extractor.extract({
      source: validated.source,
      payload: validated.payload,
      fileName: validated.fileName,
      sourceReference: validated.sourceReference,
      logger,
    });

    await updateJobStatus(jobId, "normalizing", logger);
    const bundles = normalizeExtractedData(
      validated.source,
      extraction.raw,
      logger
    );

    await updateJobStatus(jobId, "validating", logger);

    let duplicatesFound = 0;
    const validationFailures = 0;
    const recordsCreated: string[] = [];

    for (const bundle of bundles) {
      const duplicates = await detectDuplicates(bundle);
      const classification = classifyRecord(duplicates);
      const status = resolveRecordStatus(classification.recordType);
      if (classification.recordType === "update") duplicatesFound += 1;
      else if (duplicates.length) duplicatesFound += duplicates.length;

      const record = await withDatabase(() =>
        ImportRecord.create({
          jobId: job._id,
          entityType: "project",
          status,
          recordType: classification.recordType,
          slug: bundle.project.slug,
          displayName: bundle.project.projectName,
          stagedData: bundle,
          duplicates,
          existingProjectId: classification.existingProjectId,
          validationErrors: [],
        })
      );

      recordsCreated.push(String(record._id));
      logger.info("Import record staged", {
        recordId: String(record._id),
        slug: bundle.project.slug,
        recordType: classification.recordType,
      });
    }

    const finalStatus = validationFailures > 0 ? "failed" : "pending_review";

    await withDatabase(() =>
      ImportJob.findByIdAndUpdate(jobId, {
        status: finalStatus,
        recordCount: recordsCreated.length,
        duplicateCount: duplicatesFound,
        errorCount: validationFailures,
        logs: logger.getLogs(),
        completedAt: new Date(),
      })
    );

    return {
      jobId,
      status: finalStatus,
      recordsCreated: recordsCreated.length,
      duplicatesFound,
      validationFailures,
      logs: logger.getLogs(),
    };
  } catch (error) {
    logger.error("Pipeline failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    await withDatabase(() =>
      ImportJob.findByIdAndUpdate(jobId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Pipeline failed",
        logs: logger.getLogs(),
        completedAt: new Date(),
      })
    );

    throw error;
  }
}

async function updateJobStatus(
  jobId: string,
  status: string,
  logger: ReturnType<typeof createJobLogger>
) {
  await withDatabase(() =>
    ImportJob.findByIdAndUpdate(jobId, {
      status,
      logs: logger.getLogs(),
    })
  );
  logger.info(`Job status: ${status}`);
}
