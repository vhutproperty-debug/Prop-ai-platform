import type { BuilderCrawlConfig } from "@/config/builders";
import { getBuilderConfig, SUPPORTED_BUILDERS } from "@/config/builders";
import { isFirecrawlConfigured } from "@/config/env";
import { createJobLogger } from "@/lib/ingestion/logger";
import { withDatabase } from "@/lib/db/with-database";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ImportLog } from "@/models/ImportLog";
import { firecrawlService } from "@/services/firecrawl/firecrawl.service";
import { extractionService } from "@/services/extraction/extraction.service";
import { normalizationService } from "@/services/normalization/normalization.service";
import {
  deduplicationService,
} from "@/services/deduplication/deduplication.service";
import { stagedBundleSchema } from "@/validations/ingestion-bundle";
import type { PipelineResult } from "@/types/ingestion";

const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_MAX_RETRIES = 3;

async function writeLog(
  jobId: string,
  level: "success" | "warning" | "error" | "duplicate",
  message: string,
  meta?: Record<string, unknown>
) {
  await withDatabase(() =>
    ImportLog.create({
      jobId,
      level,
      message,
      meta,
      builderSlug: meta?.builderSlug as string | undefined,
      projectSlug: meta?.projectSlug as string | undefined,
      url: meta?.url as string | undefined,
    })
  );
}

async function processProjectUrl(
  jobId: string,
  builder: BuilderCrawlConfig,
  url: string,
  retryCount = 0
): Promise<{ created: boolean; updated: boolean; failed: boolean }> {
  const logger = createJobLogger("firecrawl", jobId);
  const started = Date.now();

  try {
    const scrape = await firecrawlService.scrapeUrl(url);
    const facts = extractionService.extractFromProjectPage(scrape, builder);
    const bundle = normalizationService.normalizeProject(facts, builder, url);

    const validation = stagedBundleSchema.safeParse(bundle);
    if (!validation.success) {
      await writeLog(jobId, "error", `Validation failed for ${url}`, {
        url,
        status: "validation_failed",
        durationMs: Date.now() - started,
        projectSlug: bundle.project.slug,
        builderSlug: builder.slug,
        errors: validation.error.flatten(),
      });
      return { created: false, updated: false, failed: true };
    }

    const duplicates = await deduplicationService.detectDuplicates(validation.data);
    const classification = deduplicationService.classifyRecord(duplicates);
    const status = deduplicationService.resolveRecordStatus(classification.recordType);

    await withDatabase(() =>
      ImportRecord.create({
        jobId,
        entityType: "project",
        status,
        recordType: classification.recordType,
        slug: bundle.project.slug,
        displayName: bundle.project.projectName,
        stagedData: validation.data,
        duplicates,
        existingProjectId: classification.existingProjectId,
        validationErrors: [],
      })
    );

    const logLevel =
      classification.recordType === "conflict"
        ? "warning"
        : classification.recordType === "update"
          ? "duplicate"
          : "success";

    await writeLog(
      jobId,
      logLevel,
      `${classification.recordType}: ${bundle.project.projectName}`,
      {
        url,
        status: classification.recordType,
        durationMs: Date.now() - started,
        projectSlug: bundle.project.slug,
        builderSlug: builder.slug,
        recordType: classification.recordType,
        title: facts.projectName,
        imageCount: facts.galleryImages.length + (facts.coverImage ? 1 : 0),
        linkCount: scrape.links?.length ?? 0,
      }
    );

    return {
      created: classification.recordType === "new",
      updated: classification.recordType === "update",
      failed: false,
    };
  } catch (error) {
    if (retryCount < DEFAULT_MAX_RETRIES) {
      await writeLog(jobId, "warning", `Retry ${retryCount + 1}/${DEFAULT_MAX_RETRIES} for ${url}`, {
        url,
        status: "retry",
        durationMs: Date.now() - started,
        builderSlug: builder.slug,
        error: error instanceof Error ? error.message : String(error),
      });
      await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      return processProjectUrl(jobId, builder, url, retryCount + 1);
    }

    const message = error instanceof Error ? error.message : "Scrape failed";
    await writeLog(jobId, "error", message, {
      url,
      status: "failed",
      durationMs: Date.now() - started,
      builderSlug: builder.slug,
    });
    logger.error(message, { url, durationMs: Date.now() - started });
    return { created: false, updated: false, failed: true };
  }
}

async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

export const importJobsService = {
  async runBuilderImport(options: {
    builderSlug: string;
    createdBy?: string;
    maxProjects?: number;
    batchSize?: number;
  }): Promise<PipelineResult> {
    if (!isFirecrawlConfigured) {
      throw new Error("FIRECRAWL_API_KEY is required for builder imports");
    }

    const builder = getBuilderConfig(options.builderSlug);
    if (!builder) {
      throw new Error(`Unknown builder: ${options.builderSlug}`);
    }

    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const maxProjects = options.maxProjects ?? 100;
    const logger = createJobLogger("firecrawl");
    const jobStarted = Date.now();

    const job = await withDatabase(() =>
      ImportJob.create({
        source: "firecrawl",
        builder: builder.name,
        builderSlug: builder.slug,
        status: "queued",
        sourceReference: builder.projectsListingUrl,
        createdBy: options.createdBy,
        batchSize,
        startedAt: new Date(),
        logs: [],
      })
    );

    const jobId = String(job._id);

    try {
      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, { status: "running" })
      );

      const listingScrape = await firecrawlService.scrapeUrl(
        builder.projectsListingUrl
      );
      const listing = extractionService.extractFromListing(
        listingScrape,
        builder
      );

      let projectUrls = listing.projectUrls;

      if (projectUrls.length < 3) {
        const mapped = await firecrawlService.mapLinks(builder.website, 200);
        projectUrls = mapped.filter((u) =>
          builder.projectLinkPattern?.test(u)
        );
      }

      projectUrls = [...new Set(projectUrls)].slice(0, maxProjects);

      await writeLog(jobId, "success", "Listing page crawled", {
        url: builder.projectsListingUrl,
        status: "listing_crawled",
        durationMs: Date.now() - jobStarted,
        builderSlug: builder.slug,
        projectsDetected: projectUrls.length,
        listingLinks: listing.projectUrls.length,
      });

      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, { status: "extracting" })
      );

      let projectsImported = 0;
      let projectsUpdated = 0;
      let failures = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      const results = await processBatch(
        projectUrls,
        batchSize,
        (url) => processProjectUrl(jobId, builder, url)
      );

      for (const result of results) {
        if (result.created) projectsImported++;
        if (result.updated) projectsUpdated++;
        if (result.failed) failures++;
      }

      if (failures > 0) {
        errors.push(`${failures} project(s) failed to import`);
      }

      const recordCount = projectsImported + projectsUpdated;
      const finalStatus = failures === projectUrls.length ? "failed" : "pending_review";

      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, {
          status: finalStatus,
          recordCount,
          projectsImported,
          projectsUpdated,
          errorCount: failures,
          duplicateCount: projectsUpdated,
          errors,
          warnings,
          logs: logger.getLogs(),
          completedAt: new Date(),
        })
      );

      await writeLog(jobId, "success", "Builder import completed", {
        url: builder.projectsListingUrl,
        status: finalStatus,
        durationMs: Date.now() - jobStarted,
        builderSlug: builder.slug,
        pagesCrawled: 1 + projectUrls.length,
        projectsDetected: projectUrls.length,
        projectsNormalized: recordCount,
        validationFailures: failures,
        errors: errors.length ? errors : undefined,
        warnings: warnings.length ? warnings : undefined,
      });

      return {
        jobId,
        status: finalStatus,
        recordsCreated: recordCount,
        duplicatesFound: projectsUpdated,
        validationFailures: failures,
        logs: logger.getLogs(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, {
          status: "failed",
          errorMessage: message,
          errors: [message],
          completedAt: new Date(),
          logs: logger.getLogs(),
        })
      );
      throw error;
    }
  },

  async runAllBuildersImport(options: {
    createdBy?: string;
    maxProjectsPerBuilder?: number;
  }): Promise<{ jobIds: string[] }> {
    const jobIds: string[] = [];
    for (const builder of SUPPORTED_BUILDERS) {
      const result = await this.runBuilderImport({
        builderSlug: builder.slug,
        createdBy: options.createdBy,
        maxProjects: options.maxProjectsPerBuilder ?? 50,
      });
      jobIds.push(result.jobId);
    }
    return { jobIds };
  },

  async getJob(jobId: string) {
    return withDatabase(() => ImportJob.findById(jobId).lean());
  },

  async getJobLogs(jobId: string, limit = 100) {
    return withDatabase(() =>
      ImportLog.find({ jobId }).sort({ createdAt: -1 }).limit(limit).lean()
    );
  },

  async runSingleProjectImport(options: {
    builderSlug: string;
    projectUrl?: string;
    createdBy?: string;
  }): Promise<PipelineResult & { recordId?: string; projectUrl?: string }> {
    if (!isFirecrawlConfigured) {
      throw new Error("FIRECRAWL_API_KEY is required for builder imports");
    }

    const builder = getBuilderConfig(options.builderSlug);
    if (!builder) {
      throw new Error(`Unknown builder: ${options.builderSlug}`);
    }

    const logger = createJobLogger("firecrawl");
    const jobStarted = Date.now();

    const job = await withDatabase(() =>
      ImportJob.create({
        source: "firecrawl",
        builder: builder.name,
        builderSlug: builder.slug,
        status: "queued",
        sourceReference: options.projectUrl ?? builder.projectsListingUrl,
        createdBy: options.createdBy,
        batchSize: 1,
        startedAt: new Date(),
        logs: [],
      })
    );

    const jobId = String(job._id);

    try {
      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, { status: "running" })
      );

      let projectUrl = options.projectUrl;

      if (!projectUrl) {
        const listingScrape = await firecrawlService.scrapeUrl(
          builder.projectsListingUrl
        );
        const listing = extractionService.extractFromListing(
          listingScrape,
          builder
        );
        projectUrl = listing.projectUrls[0];

        if (!projectUrl) {
          const mapped = await firecrawlService.mapLinks(builder.website, 200);
          projectUrl = mapped.find((u) => builder.projectLinkPattern?.test(u));
        }
      }

      if (!projectUrl) {
        throw new Error(`No project URL found for builder ${builder.name}`);
      }

      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, { status: "extracting" })
      );

      const result = await processProjectUrl(jobId, builder, projectUrl);

      const record = await withDatabase(() =>
        ImportRecord.findOne({ jobId }).sort({ createdAt: -1 }).lean()
      );

      const finalStatus = result.failed ? "failed" : "pending_review";

      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, {
          status: finalStatus,
          recordCount: result.failed ? 0 : 1,
          projectsImported: result.created ? 1 : 0,
          projectsUpdated: result.updated ? 1 : 0,
          errorCount: result.failed ? 1 : 0,
          errors: result.failed ? ["Single project import failed"] : [],
          logs: logger.getLogs(),
          completedAt: new Date(),
        })
      );

      await writeLog(jobId, result.failed ? "error" : "success", "Single project import completed", {
        url: projectUrl,
        status: finalStatus,
        durationMs: Date.now() - jobStarted,
        builderSlug: builder.slug,
        pagesCrawled: 1,
        projectsDetected: 1,
        projectsNormalized: result.failed ? 0 : 1,
        validationFailures: result.failed ? 1 : 0,
      });

      return {
        jobId,
        status: finalStatus,
        recordsCreated: result.failed ? 0 : 1,
        duplicatesFound: result.updated ? 1 : 0,
        validationFailures: result.failed ? 1 : 0,
        logs: logger.getLogs(),
        recordId: record ? String(record._id) : undefined,
        projectUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      await withDatabase(() =>
        ImportJob.findByIdAndUpdate(jobId, {
          status: "failed",
          errorMessage: message,
          errors: [message],
          completedAt: new Date(),
          logs: logger.getLogs(),
        })
      );
      throw error;
    }
  },
};
