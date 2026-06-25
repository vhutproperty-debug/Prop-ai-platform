import type { IntelligenceDashboardData } from "@/types/content-research";
import { withDatabase } from "@/lib/db/with-database";
import { ContentKnowledgePack } from "@/models/ContentKnowledgePack";
import { ContentArticle } from "@/models/ContentArticle";
import { opportunityEngineService } from "@/services/content-engine/intelligence/opportunity-engine.service";
import { editorialCalendarService } from "@/services/content-engine/intelligence/editorial-calendar.service";
import { freshnessEngineService } from "@/services/content-engine/intelligence/freshness-engine.service";
import { performanceIntelligenceService } from "@/services/content-engine/intelligence/performance-intelligence.service";
import { duplicateIntelligenceService } from "@/services/content-engine/intelligence/duplicate-intelligence.service";

export const contentIntelligenceService = {
  async getDashboard(): Promise<IntelligenceDashboardData> {
    const [
      opportunities,
      editorialCalendar,
      staleArticles,
      topPerformers,
      decayCandidates,
      knowledgePacksTotal,
      lowConfidenceAgg,
      articlesNeedingRefresh,
    ] = await Promise.all([
      opportunityEngineService.scan(15),
      editorialCalendarService.recommend(12),
      freshnessEngineService.listStaleArticles(10),
      performanceIntelligenceService.getTopPerformers(5),
      performanceIntelligenceService.getDecayCandidates(5),
      withDatabase(() => ContentKnowledgePack.countDocuments()),
      withDatabase(() =>
        ContentKnowledgePack.aggregate([
          { $group: { _id: null, total: { $sum: "$lowConfidenceCount" } } },
        ]).then((r) => r[0]?.total ?? 0)
      ),
      withDatabase(() => ContentArticle.countDocuments({ needsRefresh: true })),
    ]);

    const freshnessAlerts = staleArticles.map((a) => ({
      articleId: String(a._id),
      articleSlug: a.slug,
      isOutdated: true,
      affectedSections: [],
      refreshReason: a.refreshReason ?? "Marked for refresh",
      suggestedAction: "review_only" as const,
      sourceChanges: [],
    }));

    const duplicateAlerts = await duplicateIntelligenceService.analyze({
      contentType: "project_guide",
      keywords: ["Mumbai real estate"],
    });

    return {
      opportunities,
      editorialCalendar,
      freshnessAlerts,
      performanceHighlights: [...topPerformers, ...decayCandidates].slice(0, 8),
      duplicateAlerts: duplicateAlerts.slice(0, 5),
      researchStats: {
        knowledgePacksTotal,
        lowConfidenceFacts: lowConfidenceAgg,
        articlesNeedingRefresh,
      },
    };
  },
};
