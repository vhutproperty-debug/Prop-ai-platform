import type { ContentPerformanceSnapshot } from "@/types/content-research";
import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { ContentPerformance } from "@/models/ContentPerformance";
import { Lead } from "@/models/Lead";

export const performanceIntelligenceService = {
  /**
   * Sync performance metrics from available internal signals.
   * Organic traffic / CTR / rankings require analytics integration — scaffolded here.
   */
  async syncArticleMetrics(articleSlug: string) {
    return withDatabase(async () => {
      const article = await ContentArticle.findOne({ slug: articleSlug }).lean();
      if (!article) return null;

      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);

      const leadsFromArticle = await Lead.countDocuments({
        projectSlug: article.projectSlug,
        source: "project_page",
        createdAt: { $gte: periodStart },
      });

      const daysSincePublish = article.publishedAt
        ? (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      const decayScore =
        daysSincePublish > 180
          ? Math.min(100, 40 + daysSincePublish / 10)
          : article.needsRefresh
            ? 70
            : Math.max(0, 30 - article.seoScore / 5);

      const snapshot = {
        articleId: article._id,
        articleSlug: article.slug,
        organicTraffic: 0,
        ctr: 0,
        leadsGenerated: leadsFromArticle,
        conversions: 0,
        bounceRate: 0,
        averageRanking: 0,
        timeOnPage: 0,
        contentDecayScore: Math.round(decayScore),
        periodStart,
        periodEnd,
        needsRefresh: decayScore >= 60 || Boolean(article.needsRefresh),
        lastSyncedAt: new Date(),
        meta: { source: "internal_leads_proxy" },
      };

      await ContentPerformance.findOneAndUpdate(
        { articleId: article._id },
        { $set: snapshot },
        { upsert: true }
      );

      if (snapshot.needsRefresh) {
        await ContentArticle.findByIdAndUpdate(article._id, {
          needsRefresh: true,
          refreshReason: snapshot.contentDecayScore >= 60 ? "Content decay detected" : article.refreshReason,
        });
      }

      return snapshot;
    });
  },

  async getTopPerformers(limit = 10): Promise<ContentPerformanceSnapshot[]> {
    return withDatabase(async () => {
      const records = await ContentPerformance.find()
        .sort({ leadsGenerated: -1, organicTraffic: -1 })
        .limit(limit)
        .lean();

      return records.map((r) => ({
        articleId: String(r.articleId),
        articleSlug: r.articleSlug,
        organicTraffic: r.organicTraffic,
        ctr: r.ctr,
        leadsGenerated: r.leadsGenerated,
        conversions: r.conversions,
        bounceRate: r.bounceRate,
        averageRanking: r.averageRanking,
        timeOnPage: r.timeOnPage,
        contentDecayScore: r.contentDecayScore,
        periodStart: r.periodStart?.toISOString() ?? "",
        periodEnd: r.periodEnd?.toISOString() ?? "",
        needsRefresh: r.needsRefresh,
      }));
    });
  },

  async getDecayCandidates(limit = 10): Promise<ContentPerformanceSnapshot[]> {
    return withDatabase(async () => {
      const records = await ContentPerformance.find({ needsRefresh: true })
        .sort({ contentDecayScore: -1 })
        .limit(limit)
        .lean();

      return records.map((r) => ({
        articleId: String(r.articleId),
        articleSlug: r.articleSlug,
        organicTraffic: r.organicTraffic,
        ctr: r.ctr,
        leadsGenerated: r.leadsGenerated,
        conversions: r.conversions,
        bounceRate: r.bounceRate,
        averageRanking: r.averageRanking,
        timeOnPage: r.timeOnPage,
        contentDecayScore: r.contentDecayScore,
        periodStart: r.periodStart?.toISOString() ?? "",
        periodEnd: r.periodEnd?.toISOString() ?? "",
        needsRefresh: true,
      }));
    });
  },

  async syncAllPublished(batchSize = 20) {
    const articles = await withDatabase(() =>
      ContentArticle.find({ status: "published" }).select("slug").limit(batchSize).lean()
    );
    let synced = 0;
    for (const a of articles) {
      await this.syncArticleMetrics(a.slug);
      synced++;
    }
    return { synced };
  },
};
