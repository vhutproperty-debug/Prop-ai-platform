import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { ContentArticle } from "@/models/ContentArticle";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { ContentFilterInput } from "@/validations/content-engine";

export const contentArticleService = {
  async list(filters: ContentFilterInput) {
    const {
      page,
      limit,
      search,
      status,
      contentType,
      projectSlug,
      builderSlug,
      localitySlug,
      authorType,
      campaignId,
      isAiGenerated,
      dateFrom,
      dateTo,
    } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, [
          "title",
          "featuredSummary",
          "keywords",
        ]),
      };
      if (status) query.status = status;
      if (contentType) query.contentType = contentType;
      if (projectSlug) query.projectSlug = projectSlug;
      if (builderSlug) query.builderSlug = builderSlug;
      if (localitySlug) query.localitySlug = localitySlug;
      if (authorType) query.authorType = authorType;
      if (campaignId) query.campaignId = campaignId;
      if (isAiGenerated !== undefined) query.isAiGenerated = isAiGenerated;
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) (query.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
        if (dateTo) (query.createdAt as Record<string, Date>).$lte = new Date(dateTo);
      }

      const [items, total] = await Promise.all([
        ContentArticle.find(query)
          .select(
            "title slug contentType status authorType isAiGenerated isHumanEdited projectSlug builderSlug localitySlug seoScore scheduledAt publishedAt updatedAt"
          )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ContentArticle.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const item = await ContentArticle.findById(id).lean();
      if (!item) throw new NotFoundError("Article");
      return item;
    });
  },

  async getBySlug(slug: string) {
    return withDatabase(async () => {
      const item = await ContentArticle.findOne({
        slug,
        status: "published",
        isActive: true,
      }).lean();
      if (!item) throw new NotFoundError("Article");
      return item;
    });
  },

  async update(id: string, input: Record<string, unknown>, actorId?: string) {
    return withDatabase(async () => {
      const item = await ContentArticle.findByIdAndUpdate(
        id,
        {
          $set: {
            ...input,
            isHumanEdited: true,
            authorType: input.authorType ?? "hybrid",
          },
        },
        { new: true, runValidators: true }
      ).lean();
      if (!item) throw new NotFoundError("Article");

      const { contentPublishingService } = await import(
        "@/services/content-engine/publishing/content-publishing.service"
      );
      await contentPublishingService.createVersion(id, actorId, "Manual edit");

      return item;
    });
  },

  async submitForReview(id: string) {
    return withDatabase(() =>
      ContentArticle.findByIdAndUpdate(
        id,
        { status: "pending_review" },
        { new: true }
      ).lean()
    );
  },

  async bulkAction(
    ids: string[],
    action: "approve" | "publish" | "archive" | "delete"
  ) {
    const { contentPublishingService } = await import(
      "@/services/content-engine/publishing/content-publishing.service"
    );

    if (action === "approve") {
      return withDatabase(async () => {
        const result = await ContentArticle.updateMany(
          { _id: { $in: ids } },
          { $set: { status: "approved" } }
        );
        return { modified: result.modifiedCount };
      });
    }

    if (action === "publish") {
      let modified = 0;
      for (const id of ids) {
        await contentPublishingService.publish(id);
        modified++;
      }
      return { modified };
    }

    if (action === "archive") {
      let modified = 0;
      for (const id of ids) {
        await contentPublishingService.archive(id);
        modified++;
      }
      return { modified };
    }

    return withDatabase(async () => {
      const result = await ContentArticle.updateMany(
        { _id: { $in: ids } },
        { $set: { isActive: false, status: "archived" } }
      );
      return { modified: result.modifiedCount };
    });
  },
};
