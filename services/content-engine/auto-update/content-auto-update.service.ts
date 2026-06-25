import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { Project } from "@/models/Project";

/**
 * Future-ready: detects project data changes and flags affected articles for refresh.
 * Does NOT auto-overwrite published content — marks needsRefresh for admin approval.
 */
export const contentAutoUpdateService = {
  async detectProjectChanges(projectId: string) {
    return withDatabase(async () => {
      const project = await Project.findById(projectId)
        .select("slug updatedAt priceRange possessionDate status")
        .lean();
      if (!project) return { affected: 0 };

      const result = await ContentArticle.updateMany(
        {
          projectSlug: project.slug,
          status: "published",
          isActive: true,
        },
        {
          $set: {
            needsRefresh: true,
            refreshReason: "Source project data updated",
          },
        }
      );

      return { affected: result.modifiedCount, projectSlug: project.slug };
    });
  },

  async listNeedsRefresh(limit = 50) {
    return withDatabase(() =>
      ContentArticle.find({ needsRefresh: true })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean()
    );
  },

  async clearRefreshFlag(articleId: string) {
    return withDatabase(() =>
      ContentArticle.findByIdAndUpdate(articleId, {
        needsRefresh: false,
        refreshReason: undefined,
      })
    );
  },
};
