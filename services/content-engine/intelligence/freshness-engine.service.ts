import type { FreshnessAssessment } from "@/types/content-research";
import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { Project } from "@/models/Project";
import { ContentKnowledgePack } from "@/models/ContentKnowledgePack";

const SECTION_FIELD_MAP: Record<string, string[]> = {
  pricing: ["price_range", "configurations"],
  possession: ["possession"],
  construction: ["status"],
  rera: ["rera"],
  amenities: ["amenities"],
  location: ["location", "micro_market"],
};

export const freshnessEngineService = {
  async assessProjectChange(projectId: string): Promise<FreshnessAssessment[]> {
    return withDatabase(async () => {
      const project = await Project.findById(projectId)
        .select("slug projectName priceRange possessionDate status reraNumber updatedAt")
        .lean();
      if (!project) return [];

      const articles = await ContentArticle.find({
        projectSlug: project.slug,
        status: "published",
        isActive: true,
      })
        .select("_id slug sections knowledgePackId")
        .lean();

      const latestPack = await ContentKnowledgePack.findOne({
        projectId: project._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      const assessments: FreshnessAssessment[] = [];

      for (const article of articles) {
        const affectedSections: string[] = [];
        const sourceChanges: string[] = [];

        if (latestPack?.pack) {
          const pack = latestPack.pack as { verifiedFacts?: Array<{ key: string; value: string }> };
          const priceFact = pack.verifiedFacts?.find((f) => f.key === "price_range");
          const currentPrice = project.priceRange
            ? `₹${project.priceRange.min} – ₹${project.priceRange.max}`
            : "";
          if (priceFact && priceFact.value !== currentPrice) {
            affectedSections.push("pricing");
            sourceChanges.push("price_range updated");
          }
        }

        if (project.possessionDate) {
          affectedSections.push("possession");
          sourceChanges.push("possession_date updated");
        }

        if (project.status) {
          affectedSections.push("construction");
          sourceChanges.push(`status: ${project.status}`);
        }

        const uniqueSections = [...new Set(affectedSections)];

        if (uniqueSections.length) {
          await ContentArticle.findByIdAndUpdate(article._id, {
            needsRefresh: true,
            refreshReason: sourceChanges.join("; "),
          });
        }

        assessments.push({
          articleId: String(article._id),
          articleSlug: article.slug,
          isOutdated: uniqueSections.length > 0,
          affectedSections: uniqueSections,
          refreshReason: sourceChanges.join("; ") || "Source data may have changed",
          suggestedAction:
            uniqueSections.length >= 3 ? "full_regenerate" : "regenerate_sections",
          sourceChanges,
        });
      }

      return assessments.filter((a) => a.isOutdated);
    });
  },

  async listStaleArticles(limit = 50) {
    return withDatabase(() =>
      ContentArticle.find({ needsRefresh: true, status: "published" })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select("title slug refreshReason projectSlug contentType updatedAt")
        .lean()
    );
  },

  getSectionsForFactKeys(keys: string[]): string[] {
    const sections = new Set<string>();
    for (const [section, fields] of Object.entries(SECTION_FIELD_MAP)) {
      if (fields.some((f) => keys.includes(f))) sections.add(section);
    }
    return [...sections];
  },
};
