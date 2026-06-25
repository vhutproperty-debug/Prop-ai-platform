import type { ContentType } from "@/config/content-engine";
import type { ContentOpportunity } from "@/types/content-research";
import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { ContentArticle } from "@/models/ContentArticle";
import { FAQ } from "@/models/FAQ";

const PROJECT_CONTENT_TYPES: ContentType[] = [
  "project_guide",
  "price_analysis",
  "investment_analysis",
  "amenities_guide",
  "faq_article",
];

export const opportunityEngineService = {
  async scan(limit = 30): Promise<ContentOpportunity[]> {
    return withDatabase(async () => {
      const opportunities: ContentOpportunity[] = [];

      const [projects, builders, localities] = await Promise.all([
        Project.find({ isActive: true }).select("_id slug projectName microMarket").limit(200).lean(),
        Builder.find({ isActive: true }).select("_id slug name").limit(100).lean(),
        Location.find({ isActive: true }).select("_id slug name city").limit(100).lean(),
      ]);

      const [publishedByProject, publishedByBuilder, publishedByLocality, faqCounts] =
        await Promise.all([
          ContentArticle.aggregate([
            { $match: { status: "published", projectSlug: { $exists: true } } },
            { $group: { _id: { slug: "$projectSlug", type: "$contentType" }, count: { $sum: 1 } } },
          ]),
          ContentArticle.distinct("builderSlug", { status: "published", contentType: "builder_profile" }),
          ContentArticle.distinct("localitySlug", { status: "published", contentType: "location_guide" }),
          FAQ.aggregate([
            { $match: { entityType: "project", isActive: true } },
            { $group: { _id: "$entityId", count: { $sum: 1 } } },
          ]),
        ]);

      const publishedSet = new Set(
        publishedByProject.map((p: { _id: { slug: string; type: string } }) =>
          `${p._id.slug}:${p._id.type}`
        )
      );

      for (const project of projects) {
        for (const contentType of PROJECT_CONTENT_TYPES) {
          const key = `${project.slug}:${contentType}`;
          if (!publishedSet.has(key)) {
            opportunities.push({
              type:
                contentType === "faq_article"
                  ? "missing_faq_coverage"
                  : contentType === "price_analysis"
                    ? "missing_price_analysis"
                    : "missing_project_guide",
              priority: contentType === "project_guide" ? 90 : 70,
              title: `Missing ${contentType.replace(/_/g, " ")} for ${project.projectName}`,
              description: `No published ${contentType} for this active project.`,
              suggestedContentType: contentType,
              entityType: "project",
              entityId: String(project._id),
              entitySlug: project.slug,
              entityName: project.projectName,
            });
          }
        }

        const faqCount = faqCounts.find(
          (f: { _id: unknown }) => String(f._id) === String(project._id)
        ) as { count: number } | undefined;
        if (!faqCount || faqCount.count < 3) {
          opportunities.push({
            type: "missing_faq_coverage",
            priority: 60,
            title: `Low FAQ coverage: ${project.projectName}`,
            description: "Fewer than 3 FAQs in database for this project.",
            suggestedContentType: "faq_article",
            entityType: "project",
            entityId: String(project._id),
            entitySlug: project.slug,
            entityName: project.projectName,
          });
        }
      }

      const builderProfileSet = new Set(publishedByBuilder);
      for (const builder of builders) {
        if (!builderProfileSet.has(builder.slug)) {
          opportunities.push({
            type: "missing_builder_profile",
            priority: 75,
            title: `Missing builder profile: ${builder.name}`,
            description: "No published builder profile article.",
            suggestedContentType: "builder_profile",
            entityType: "builder",
            entityId: String(builder._id),
            entitySlug: builder.slug,
            entityName: builder.name,
          });
        }
      }

      const localityGuideSet = new Set(publishedByLocality);
      for (const locality of localities) {
        if (!localityGuideSet.has(locality.slug)) {
          opportunities.push({
            type: "missing_locality_guide",
            priority: 80,
            title: `Missing locality guide: ${locality.name}`,
            description: `No location guide for ${locality.name}, ${locality.city}.`,
            suggestedContentType: "location_guide",
            entityType: "locality",
            entityId: String(locality._id),
            entitySlug: locality.slug,
            entityName: locality.name,
          });
        }
      }

      const microMarkets = [...new Set(projects.map((p) => p.microMarket).filter(Boolean))];
      for (const mm of microMarkets.slice(0, 20)) {
        const inMarket = projects.filter((p) => p.microMarket === mm);
        if (inMarket.length >= 2) {
          const hasComparison = await ContentArticle.exists({
            contentType: "comparison",
            status: "published",
            keywords: mm,
          });
          if (!hasComparison) {
            opportunities.push({
              type: "missing_comparison",
              priority: 65,
              title: `Comparison article: ${mm} projects`,
              description: `${inMarket.length} projects in ${mm} — comparison content missing.`,
              suggestedContentType: "comparison",
              entityType: "locality",
              entityId: String(inMarket[0]._id),
              entitySlug: inMarket[0].slug,
              entityName: mm as string,
            });
          }
        }
      }

      return opportunities
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit);
    });
  },
};
