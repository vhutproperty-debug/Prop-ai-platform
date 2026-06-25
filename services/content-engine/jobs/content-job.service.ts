import type { ContentType } from "@/config/content-engine";
import { DEFAULT_GENERATION_CONTENT_TYPES } from "@/config/content-engine";
import type { GenerationRequest } from "@/types/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { ContentJob } from "@/models/ContentJob";
import { ContentAuditLog } from "@/models/ContentAuditLog";
import { contentSourceRegistry } from "@/services/content-engine/sources/content-source.registry";
import { researchPipelineService } from "@/services/content-engine/research/research-pipeline.service";
import { knowledgePackGenerationService } from "@/services/content-engine/ai/knowledge-pack-generation.service";
import { contentValidationService } from "@/services/content-engine/ai/validation.service";
import { contentPublishingService } from "@/services/content-engine/publishing/content-publishing.service";
import { factValidatorService } from "@/services/content-engine/research/fact-validator.service";

const BATCH_SIZE = 3;

export const contentJobService = {
  async runGenerationJob(request: GenerationRequest) {
    const contentTypes = request.contentTypes.length
      ? request.contentTypes
      : DEFAULT_GENERATION_CONTENT_TYPES;

    const job = await withDatabase(() =>
      ContentJob.create({
        type: "bulk_generate",
        status: "queued",
        payload: request,
        createdBy: request.createdBy,
        startedAt: new Date(),
      })
    );

    const jobId = String(job._id);
    const articleIds: string[] = [];
    const errors: string[] = [];

    try {
      await withDatabase(() =>
        ContentJob.findByIdAndUpdate(jobId, { status: "running" })
      );

      const context = await contentSourceRegistry.loadFromProject(request.projectId);
      if (!context?.project) {
        throw new Error(`Project not found: ${request.projectId}`);
      }

      const tasks: ContentType[] = [];
      const qty = request.quantityPerType ?? 1;
      for (const type of contentTypes) {
        for (let i = 0; i < qty; i++) tasks.push(type);
      }

      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        const batch = tasks.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (contentType) => {
            const research = await researchPipelineService.run({
              projectId: request.projectId,
              contentType,
              jobId,
              createdBy: request.createdBy,
            });

            if (research.blocked) {
              throw new Error(research.blockReason ?? "Research blocked");
            }

            if (research.validationErrors.length) {
              throw new Error(research.validationErrors.join("; "));
            }

            const payload = await knowledgePackGenerationService.generateFromPack(
              research.knowledgePack,
              request.projectId
            );

            const validationErrors = contentValidationService.validatePayload(payload);
            if (validationErrors.length) {
              throw new Error(validationErrors.join("; "));
            }

            payload.slug = await contentValidationService.ensureUniqueSlug(payload.slug);

            const reviewFlags = factValidatorService.getReviewFlags(research.knowledgePack);

            const article = await contentPublishingService.saveDraft({
              payload,
              context,
              contentType,
              campaignId: request.campaignId,
              authorId: request.createdBy,
              jobId,
              knowledgePackId: research.knowledgePack.id,
              lowConfidenceFacts: reviewFlags,
              researchCompleteness: research.knowledgePack.dataCompleteness,
              duplicateWarnings: research.duplicateWarnings,
            });

            return String(article._id);
          })
        );

        for (const result of results) {
          if (result.status === "fulfilled") articleIds.push(result.value);
          else errors.push(result.reason?.message ?? "Generation failed");
        }
      }

      const finalStatus = errors.length === tasks.length ? "failed" : "completed";

      await withDatabase(() =>
        ContentJob.findByIdAndUpdate(jobId, {
          status: finalStatus,
          articleIds,
          articlesCreated: articleIds.length,
          articlesFailed: errors.length,
          errors,
          completedAt: new Date(),
        })
      );

      await ContentAuditLog.create({
        jobId,
        action: "generated",
        actorId: request.createdBy,
        meta: { articlesCreated: articleIds.length, errors: errors.length },
      });

      return { jobId, articleIds, errors, status: finalStatus };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job failed";
      await withDatabase(() =>
        ContentJob.findByIdAndUpdate(jobId, {
          status: "failed",
          errors: [message],
          completedAt: new Date(),
        })
      );
      throw error;
    }
  },

  async getJob(jobId: string) {
    return withDatabase(() => ContentJob.findById(jobId).lean());
  },

  async listJobs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return withDatabase(async () => {
      const [items, total] = await Promise.all([
        ContentJob.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ContentJob.countDocuments(),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    });
  },
};
