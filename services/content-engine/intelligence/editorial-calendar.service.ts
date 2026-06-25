import type { EditorialRecommendation } from "@/types/content-research";
import type { ContentType } from "@/config/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { opportunityEngineService } from "@/services/content-engine/intelligence/opportunity-engine.service";

const FESTIVAL_CAMPAIGNS = [
  { month: 10, theme: "Diwali", contentTypes: ["buying_guide", "investment_analysis"] as ContentType[] },
  { month: 3, theme: "Gudi Padwa", contentTypes: ["buying_guide", "project_guide"] as ContentType[] },
  { month: 8, theme: "Independence Day Offers", contentTypes: ["price_analysis", "news"] as ContentType[] },
];

export const editorialCalendarService = {
  async recommend(limit = 20): Promise<EditorialRecommendation[]> {
    const now = new Date();
    const recommendations: EditorialRecommendation[] = [];
    const opportunities = await opportunityEngineService.scan(10);

    recommendations.push({
      type: "daily_topic",
      title: `Daily: Top project spotlight`,
      description: "Publish or refresh one high-priority project guide.",
      suggestedDate: now.toISOString().slice(0, 10),
      priority: 85,
      contentTypes: ["project_guide"],
    });

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + (7 - now.getDay()));
    recommendations.push({
      type: "weekly_topic",
      title: "Weekly: Micro-market roundup",
      description: "Cover price trends and new launches in a micro-market.",
      suggestedDate: weekStart.toISOString().slice(0, 10),
      priority: 75,
      contentTypes: ["market_trends", "price_analysis"],
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    recommendations.push({
      type: "monthly_report",
      title: "Monthly: Mumbai real estate market report",
      description: "Aggregate investment and rental insights across localities.",
      suggestedDate: monthStart.toISOString().slice(0, 10),
      priority: 70,
      contentTypes: ["market_trends", "investment_analysis"],
    });

    for (const fest of FESTIVAL_CAMPAIGNS) {
      if (fest.month === now.getMonth() + 1 || fest.month === now.getMonth() + 2) {
        recommendations.push({
          type: "festival_campaign",
          title: `${fest.theme} content campaign`,
          description: `Seasonal campaign aligned with ${fest.theme}.`,
          suggestedDate: new Date(now.getFullYear(), fest.month - 1, 1).toISOString().slice(0, 10),
          priority: 80,
          contentTypes: fest.contentTypes,
          campaignTheme: fest.theme,
        });
      }
    }

    const upcomingProjects = await withDatabase(() =>
      Project.find({ status: "upcoming", isActive: true })
        .select("slug projectName")
        .limit(5)
        .lean()
    );

    for (const project of upcomingProjects) {
      recommendations.push({
        type: "builder_launch",
        title: `Launch campaign: ${project.projectName}`,
        description: "Pre-launch content package for upcoming project.",
        suggestedDate: now.toISOString().slice(0, 10),
        priority: 90,
        contentTypes: ["project_guide", "price_analysis", "faq_article"],
        entityType: "project",
        entitySlug: project.slug,
      });
    }

    for (const opp of opportunities.slice(0, 5)) {
      recommendations.push({
        type: "investment_opportunity",
        title: opp.title,
        description: opp.description,
        suggestedDate: now.toISOString().slice(0, 10),
        priority: opp.priority,
        contentTypes: [opp.suggestedContentType],
        entityType: opp.entityType,
        entitySlug: opp.entitySlug,
      });
    }

    recommendations.push({
      type: "infrastructure_update",
      title: "Infrastructure connectivity roundup",
      description: "Metro and road connectivity updates affecting key micro-markets.",
      suggestedDate: weekStart.toISOString().slice(0, 10),
      priority: 60,
      contentTypes: ["connectivity_guide", "location_guide"],
    });

    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, limit);
  },
};
