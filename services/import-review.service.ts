import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { publishBundle } from "@/services/publishing/publishing.service";
import { createJobLogger } from "@/lib/ingestion/logger";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import type { NormalizedImportBundle } from "@/types/ingestion";

export const importReviewService = {
  async listJobs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await withDatabase(() =>
      Promise.all([
        ImportJob.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ImportJob.countDocuments(),
      ])
    );
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getJob(jobId: string) {
    const job = await withDatabase(() => ImportJob.findById(jobId).lean());
    if (!job) throw new NotFoundError("Import job");
    return job;
  },

  async getJobRecords(jobId: string) {
    return withDatabase(() =>
      ImportRecord.find({ jobId }).sort({ createdAt: -1 }).lean()
    );
  },

  async getRecord(recordId: string) {
    const record = await withDatabase(() => ImportRecord.findById(recordId).lean());
    if (!record) throw new NotFoundError("Import record");
    return record;
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

  async publishRecord(recordId: string, reviewedBy: string) {
    const record = await withDatabase(() => ImportRecord.findById(recordId));
    if (!record) throw new NotFoundError("Import record");

    if (record.status === "published") {
      return { record, projectId: record.publishedId };
    }

    if (record.status !== "approved" && record.status !== "staged") {
      throw new Error(`Cannot publish record with status: ${record.status}`);
    }

    const logger = createJobLogger(
      (record.stagedData as NormalizedImportBundle).source,
      String(record.jobId)
    );

    const isUpdate =
      record.recordType === "update" || record.status === "update";

    const projectId = await publishBundle(
      record.stagedData as NormalizedImportBundle,
      logger,
      {
        existingProjectId: record.existingProjectId
          ? String(record.existingProjectId)
          : undefined,
        isUpdate,
        publishActive: true,
      }
    );

    const updated = await withDatabase(() =>
      ImportRecord.findByIdAndUpdate(
        recordId,
        {
          status: "published",
          publishedId: projectId,
          reviewedBy,
          reviewedAt: new Date(),
        },
        { new: true }
      ).lean()
    );

    await withDatabase(() =>
      ImportJob.findByIdAndUpdate(record.jobId, {
        $inc: { publishedCount: 1 },
      })
    );

    return { record: updated, projectId };
  },

  async listPendingReview(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await withDatabase(() =>
      Promise.all([
        ImportRecord.find({ status: { $in: ["staged", "duplicate", "update", "conflict", "approved"] } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ImportRecord.countDocuments({
          status: { $in: ["staged", "duplicate", "update", "conflict", "approved"] },
        }),
      ])
    );
    return { items, total, page, limit };
  },
};
