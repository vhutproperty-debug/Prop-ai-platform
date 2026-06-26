import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";

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
    const { publishOrchestratorService } = await import(
      "@/services/publish-workflow/publish-orchestrator.service"
    );
    return publishOrchestratorService.publishImportRecord(recordId, reviewedBy);
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
