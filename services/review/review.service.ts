import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { publishBundle } from "@/services/publishing/publishing.service";
import { createJobLogger } from "@/lib/ingestion/logger";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ImportLog } from "@/models/ImportLog";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { ImportJobMetrics } from "@/types/firecrawl-import";

export const reviewService = {
  async getMetrics(): Promise<ImportJobMetrics> {
    const [
      totalBuilders,
      totalProjects,
      importJobs,
      projectsImported,
      projectsUpdated,
      duplicates,
      failures,
      pendingReviews,
    ] = await withDatabase(() =>
      Promise.all([
        Builder.countDocuments({ isActive: true }),
        Project.countDocuments({ isActive: true }),
        ImportJob.countDocuments(),
        ImportJob.aggregate([
          { $group: { _id: null, total: { $sum: "$projectsImported" } } },
        ]).then((r) => r[0]?.total ?? 0),
        ImportJob.aggregate([
          { $group: { _id: null, total: { $sum: "$projectsUpdated" } } },
        ]).then((r) => r[0]?.total ?? 0),
        ImportRecord.countDocuments({ recordType: "duplicate" }),
        ImportJob.countDocuments({ status: "failed" }),
        ImportRecord.countDocuments({
          status: { $in: ["staged", "update", "duplicate", "conflict", "approved"] },
        }),
      ])
    );

    return {
      totalBuilders,
      totalProjects,
      importJobs,
      projectsImported,
      projectsUpdated,
      duplicates,
      failures,
      pendingReviews,
    };
  },

  async listReviewQueue(options?: {
    recordType?: "new" | "update" | "duplicate" | "conflict";
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      status: { $in: ["staged", "update", "duplicate", "conflict", "approved"] },
    };
    if (options?.recordType) {
      filter.recordType = options.recordType;
    }

    const [items, total, newCount, updateCount, duplicateCount, conflictCount] =
      await withDatabase(() =>
        Promise.all([
          ImportRecord.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          ImportRecord.countDocuments(filter),
          ImportRecord.countDocuments({
            ...filter,
            recordType: "new",
            status: { $in: ["staged", "approved"] },
          }),
          ImportRecord.countDocuments({
            ...filter,
            recordType: "update",
          }),
          ImportRecord.countDocuments({
            ...filter,
            recordType: "duplicate",
          }),
          ImportRecord.countDocuments({
            ...filter,
            recordType: "conflict",
          }),
        ])
      );

    return {
      items,
      total,
      page,
      limit,
      counts: {
        new: newCount,
        updated: updateCount,
        duplicates: duplicateCount,
        conflicts: conflictCount,
      },
    };
  },

  async approveRecord(recordId: string, reviewedBy: string, notes?: string) {
    const record = await withDatabase(() =>
      ImportRecord.findByIdAndUpdate(
        recordId,
        {
          status: "approved",
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
        { new: true }
      ).lean()
    );
    if (!record) throw new NotFoundError("Import record");
    return record;
  },

  async rejectRecord(recordId: string, reviewedBy: string, notes?: string) {
    const record = await withDatabase(() =>
      ImportRecord.findByIdAndUpdate(
        recordId,
        {
          status: "rejected",
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
        { new: true }
      ).lean()
    );
    if (!record) throw new NotFoundError("Import record");
    return record;
  },

  async mergeRecord(
    recordId: string,
    targetProjectId: string,
    reviewedBy: string
  ) {
    const record = await withDatabase(() => ImportRecord.findById(recordId));
    if (!record) throw new NotFoundError("Import record");

    const bundle = record.stagedData as NormalizedImportBundle;
    const logger = createJobLogger(bundle.source, String(record.jobId));

    const projectId = await publishBundle(bundle, logger, {
      existingProjectId: targetProjectId,
      isUpdate: true,
      publishActive: false,
    });

    const updated = await withDatabase(() =>
      ImportRecord.findByIdAndUpdate(
        recordId,
        {
          status: "published",
          recordType: "update",
          publishedId: projectId,
          existingProjectId: targetProjectId,
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: `Merged into project ${targetProjectId}`,
        },
        { new: true }
      ).lean()
    );

    await withDatabase(() =>
      ImportLog.create({
        jobId: record.jobId,
        recordId: record._id,
        level: "success",
        message: `Merged into project ${targetProjectId}`,
        projectSlug: record.slug,
      })
    );

    return { record: updated, projectId };
  },

  async publishRecord(recordId: string, reviewedBy: string) {
    const { publishOrchestratorService } = await import(
      "@/services/publish-workflow/publish-orchestrator.service"
    );
    return publishOrchestratorService.publishImportRecord(recordId, reviewedBy);
  },
};
