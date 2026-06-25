import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import type { ContentDashboardMetrics } from "@/types/content-engine";

export const contentDashboardService = {
  async getMetrics(): Promise<ContentDashboardMetrics> {
    return withDatabase(async () => {
      const [
        totalArticles,
        drafts,
        scheduled,
        published,
        aiGenerated,
        humanEdited,
        lastPublishedDoc,
        projectCoverage,
        builderCoverage,
        localityCoverage,
        lowSeoCount,
        publishingQueue,
      ] = await Promise.all([
        ContentArticle.countDocuments(),
        ContentArticle.countDocuments({ status: "draft" }),
        ContentArticle.countDocuments({ status: "scheduled" }),
        ContentArticle.countDocuments({ status: "published" }),
        ContentArticle.countDocuments({ isAiGenerated: true }),
        ContentArticle.countDocuments({ isHumanEdited: true }),
        ContentArticle.findOne({ status: "published" })
          .sort({ publishedAt: -1 })
          .select("publishedAt")
          .lean(),
        ContentArticle.distinct("projectSlug", {
          projectSlug: { $exists: true, $ne: null },
          status: "published",
        }).then((s) => s.filter(Boolean).length),
        ContentArticle.distinct("builderSlug", {
          builderSlug: { $exists: true, $ne: null },
          status: "published",
        }).then((s) => s.filter(Boolean).length),
        ContentArticle.distinct("localitySlug", {
          localitySlug: { $exists: true, $ne: null },
          status: "published",
        }).then((s) => s.filter(Boolean).length),
        ContentArticle.countDocuments({
          $or: [{ seoScore: { $lt: 60 } }, { seoScore: { $exists: false } }],
          status: { $in: ["draft", "pending_review", "published"] },
        }),
        ContentArticle.countDocuments({
          status: { $in: ["pending_review", "approved", "scheduled"] },
        }),
      ]);

      const seoHealth =
        totalArticles > 0
          ? Math.round(((totalArticles - lowSeoCount) / totalArticles) * 100)
          : 100;

      return {
        totalArticles,
        drafts,
        scheduled,
        published,
        aiGenerated,
        humanEdited,
        lastPublished: lastPublishedDoc?.publishedAt
          ? new Date(lastPublishedDoc.publishedAt).toISOString()
          : null,
        projectCoverage,
        builderCoverage,
        localityCoverage: localityCoverage,
        seoHealth,
        publishingQueue,
      };
    });
  },
};
