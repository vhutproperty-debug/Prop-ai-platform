import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { ContentAuditLog } from "@/models/ContentAuditLog";
import { contentPublishingService } from "@/services/content-engine/publishing/content-publishing.service";

export const contentSchedulingService = {
  async schedule(input: {
    articleId: string;
    scheduledAt: Date;
    priority?: number;
    campaignId?: string;
    actorId?: string;
  }) {
    return withDatabase(async () => {
      const article = await ContentArticle.findByIdAndUpdate(
        input.articleId,
        {
          status: "scheduled",
          scheduledAt: input.scheduledAt,
          priority: input.priority ?? 0,
          campaignId: input.campaignId,
        },
        { new: true }
      ).lean();

      await ContentAuditLog.create({
        articleId: input.articleId,
        action: "scheduled",
        actorId: input.actorId,
        meta: { scheduledAt: input.scheduledAt.toISOString() },
      });

      return article;
    });
  },

  async getDueArticles(limit = 50) {
    return withDatabase(() =>
      ContentArticle.find({
        status: "scheduled",
        scheduledAt: { $lte: new Date() },
        isActive: true,
      })
        .sort({ priority: -1, scheduledAt: 1 })
        .limit(limit)
        .lean()
    );
  },

  async processDueQueue(actorId?: string) {
    const due = await this.getDueArticles();
    const results = [];

    for (const article of due) {
      const published = await contentPublishingService.publish(
        String(article._id),
        actorId
      );
      results.push(published);
    }

    return { processed: results.length, articles: results };
  },

  async listScheduled(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return withDatabase(async () => {
      const [items, total] = await Promise.all([
        ContentArticle.find({ status: "scheduled" })
          .sort({ scheduledAt: 1, priority: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ContentArticle.countDocuments({ status: "scheduled" }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    });
  },
};
