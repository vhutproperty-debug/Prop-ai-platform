import {
  healthStatusToScore,
  PLATFORM_READINESS_DIMENSIONS,
  READINESS_DIMENSION_LABELS,
  scoreToReadinessLevel,
} from "@/config/mission-control-v2";
import { SUPPORTED_BUILDERS } from "@/config/builders";
import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import { Location } from "@/models/Location";
import { ContentArticle } from "@/models/ContentArticle";
import { ContentJob } from "@/models/ContentJob";
import { ContentAuditLog } from "@/models/ContentAuditLog";
import { Lead } from "@/models/Lead";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ImportLog } from "@/models/ImportLog";
import { NearbyPlace } from "@/models/NearbyPlace";
import type { ProjectAnalyticsSnapshot } from "@/services/mission-control/project-analytics.service";
import { projectAnalyticsService } from "@/services/mission-control/project-analytics.service";
import type {
  ActionRequiredItem,
  AiCenterMetrics,
  ContentFactoryMetrics,
  CrmMetrics,
  DataQualityMetrics,
  ExecutiveTimelineItem,
  GlobalHealthReport,
  GlobalHealthReportRow,
  ImportEngineMetrics,
  LocalityCoverageMetrics,
  MissionControlAlert,
  MissionControlExecutiveData,
  MissionControlKpis,
  PlatformReadinessScore,
  PlatformServiceHealth,
  ProjectFactoryMetrics,
  SeoCenterMetrics,
  TodayBusinessSnapshot,
  BuilderPerformanceRow,
} from "@/types/mission-control";

interface ExecutiveBuildInput {
  today: Date;
  snapshot: ProjectAnalyticsSnapshot;
  kpis: MissionControlKpis;
  platformHealth: PlatformServiceHealth[];
  importEngine: ImportEngineMetrics;
  projectFactory: ProjectFactoryMetrics;
  contentFactory: ContentFactoryMetrics;
  seoCenter: SeoCenterMetrics;
  mediaCenter: { projectsMissingMedia: number };
  aiCenter: AiCenterMetrics;
  crm: CrmMetrics;
  alerts: MissionControlAlert[];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function aiModuleScore(aiCenter: AiCenterMetrics): number {
  const statuses = [
    aiCenter.embeddings,
    aiCenter.semanticSearch,
    aiCenter.recommendationEngine,
    aiCenter.aiAssistant,
    aiCenter.brokerCopilot,
  ];
  return average(statuses.map(healthStatusToScore));
}

export const executiveIntelligenceService = {
  async build(input: ExecutiveBuildInput): Promise<MissionControlExecutiveData> {
    const [
      todaySnapshot,
      builderPerformance,
      localityCoverage,
      executiveTimeline,
      pendingReviewRecords,
      failedJobsToday,
      brokenSitemap,
    ] = await Promise.all([
      this.getTodaySnapshot(input.today, input.kpis),
      this.getBuilderPerformance(),
      this.getLocalityCoverage(input.snapshot),
      this.getExecutiveTimeline(60),
      withDatabase(() =>
        ImportRecord.countDocuments({
          status: { $in: ["staged", "approved", "duplicate", "update", "conflict"] },
        })
      ),
      withDatabase(() =>
        Promise.all([
          ImportJob.countDocuments({
            status: "failed",
            createdAt: { $gte: input.today },
          }),
          ContentJob.countDocuments({
            status: "failed",
            createdAt: { $gte: input.today },
          }),
        ]).then(([a, b]) => a + b)
      ),
      withDatabase(() =>
        ImportRecord.countDocuments({
          validationErrors: { $exists: true, $not: { $size: 0 } },
        })
      ),
    ]);

    const dataQuality = this.buildDataQuality(input.snapshot, input.importEngine);
    const platformReadiness = this.buildPlatformReadiness(input);
    const globalHealthReport = this.buildGlobalHealthReport(input, dataQuality, platformReadiness);
    const actionRequired = this.buildActionRequired({
      ...input,
      pendingReviewRecords,
      failedJobsToday,
      brokenSitemap,
    });
    const smartNotifications = this.buildSmartNotifications(actionRequired, input.platformHealth);
    const projectCompletion = projectAnalyticsService.toProjectCompletionScores(input.snapshot);

    return {
      platformReadiness,
      todaySnapshot,
      actionRequired,
      projectCompletion,
      builderPerformance,
      localityCoverage,
      dataQuality,
      executiveTimeline,
      smartNotifications,
      globalHealthReport,
    };
  },

  async getTodaySnapshot(
    today: Date,
    kpis: MissionControlKpis
  ): Promise<TodayBusinessSnapshot> {
    return withDatabase(async () => {
      const [
        projectsImportedToday,
        projectsPublishedToday,
        blogsGeneratedToday,
        leadsReceivedToday,
        buildersProcessedToday,
        failedJobsToday,
        pendingContentApprovals,
      ] = await Promise.all([
        ImportRecord.countDocuments({ createdAt: { $gte: today } }),
        ImportRecord.countDocuments({
          status: "published",
          reviewedAt: { $gte: today },
        }),
        ContentArticle.countDocuments({ createdAt: { $gte: today } }),
        Lead.countDocuments({ createdAt: { $gte: today } }),
        ImportJob.distinct("builderSlug", { createdAt: { $gte: today } }).then(
          (slugs) => slugs.filter(Boolean).length
        ),
        Promise.all([
          ImportJob.countDocuments({ status: "failed", createdAt: { $gte: today } }),
          ContentJob.countDocuments({ status: "failed", createdAt: { $gte: today } }),
        ]).then(([a, b]) => a + b),
        ContentArticle.countDocuments({ status: "pending_review" }),
      ]);

      return {
        projectsImportedToday,
        projectsPublishedToday,
        blogsGeneratedToday,
        leadsReceivedToday,
        buildersProcessedToday,
        failedJobsToday,
        pendingReviews: kpis.pendingReviews,
        pendingContentApprovals,
      };
    });
  },

  buildPlatformReadiness(input: ExecutiveBuildInput): PlatformReadinessScore {
    const infraOnline = input.platformHealth.filter((s) => s.status === "online").length;
    const infraScore = input.platformHealth.length
      ? Math.round((infraOnline / input.platformHealth.length) * 100)
      : 0;

    const activeProjects = input.snapshot.activeCount || 1;
    const seoComplete = Math.max(
      0,
      Math.round(
        ((activeProjects - input.snapshot.missingSeo) / activeProjects) * 100
      )
    );

    const contentTotal = input.contentFactory.articlesGenerated || 1;
    const contentScore = Math.round(
      (input.contentFactory.published / contentTotal) * 100
    );

    const rawScores: Record<string, number> = {
      infrastructureHealth: infraScore,
      importEngine: input.importEngine.successRate,
      projectCompletion: input.snapshot.avgCompletionPercent,
      contentEngine: Math.max(0, contentScore - input.contentFactory.failedJobs),
      seo: seoComplete,
      locationIntelligence: input.snapshot.poiCompletePercent,
      mediaAssets: input.snapshot.mediaCompletePercent,
      aiModules: aiModuleScore(input.aiCenter),
    };

    const dimensions: PlatformReadinessScore["dimensions"] = {};
    for (const key of PLATFORM_READINESS_DIMENSIONS) {
      const score = Math.min(100, Math.max(0, rawScores[key] ?? 0));
      dimensions[key] = { score, level: scoreToReadinessLevel(score) };
    }

    const overall = average(
      PLATFORM_READINESS_DIMENSIONS.map((key) => dimensions[key]?.score ?? 0)
    );

    return {
      overall,
      level: scoreToReadinessLevel(overall),
      dimensions: Object.fromEntries(
        PLATFORM_READINESS_DIMENSIONS.map((key) => [
          READINESS_DIMENSION_LABELS[key],
          dimensions[key]!,
        ])
      ),
    };
  },

  buildDataQuality(
    snapshot: ProjectAnalyticsSnapshot,
    importEngine: ImportEngineMetrics
  ): DataQualityMetrics {
    const issueCount =
      snapshot.missingMandatoryFields +
      snapshot.brokenImages +
      snapshot.missing.floorPlans +
      snapshot.missingCoordinates +
      snapshot.missingSeo +
      snapshot.missingMetaDescriptions +
      snapshot.invalidUrls +
      importEngine.duplicateProjects;

    const denominator = Math.max(snapshot.activeCount * 4, 1);
    const score = Math.max(0, Math.round(100 - (issueCount / denominator) * 100));

    return {
      score,
      level: scoreToReadinessLevel(score),
      duplicateProjects: importEngine.duplicateProjects,
      missingMandatoryFields: snapshot.missingMandatoryFields,
      brokenImages: snapshot.brokenImages,
      missingFloorPlans: snapshot.missing.floorPlans,
      missingCoordinates: snapshot.missingCoordinates,
      missingSeo: snapshot.missingSeo,
      missingMetaDescriptions: snapshot.missingMetaDescriptions,
      invalidUrls: snapshot.invalidUrls,
    };
  },

  buildActionRequired(input: {
    snapshot: ProjectAnalyticsSnapshot;
    importEngine: ImportEngineMetrics;
    contentFactory: ContentFactoryMetrics;
    seoCenter: SeoCenterMetrics;
    pendingReviewRecords: number;
    failedJobsToday: number;
    brokenSitemap: number;
  }): ActionRequiredItem[] {
    const items: ActionRequiredItem[] = [];

    const push = (item: ActionRequiredItem) => {
      if (item.count > 0) items.push(item);
    };

    push({
      id: "pending-review",
      title: "Projects Waiting for Review",
      description: "Imported projects need admin approval before publish.",
      count: input.pendingReviewRecords,
      severity: "warning",
      actionLabel: "Review Imports",
      href: "/admin/imports/review",
    });
    push({
      id: "missing-gallery",
      title: "Projects Missing Gallery Images",
      description: "Landing pages need visual assets for conversion.",
      count: input.snapshot.missing.images,
      severity: "warning",
      actionLabel: "Fix Media",
      href: "/admin/media",
    });
    push({
      id: "missing-floorplans",
      title: "Projects Missing Floor Plans",
      description: "Buyers expect layout details on project pages.",
      count: input.snapshot.missing.floorPlans,
      severity: "warning",
      actionLabel: "Upload Plans",
      href: "/admin/projects",
    });
    push({
      id: "missing-poi",
      title: "Projects Missing Nearby Places",
      description: "Location intelligence incomplete for these listings.",
      count: input.snapshot.projectsMissingPoi,
      severity: "warning",
      actionLabel: "Add POI",
      href: "/admin/nearby-places",
    });
    push({
      id: "missing-blogs",
      title: "Projects Without Blogs",
      description: "Content cluster not generated for published projects.",
      count: input.snapshot.rows.filter((row) => !row.checklist.blogs).length,
      severity: "warning",
      actionLabel: "Generate Blogs",
      href: "/admin/content/generate",
    });
    push({
      id: "missing-seo",
      title: "Projects Missing SEO",
      description: "Meta titles or descriptions are incomplete.",
      count: input.snapshot.missingSeo,
      severity: "warning",
      actionLabel: "Fix SEO",
      href: "/admin/content",
    });
    push({
      id: "failed-imports",
      title: "Failed Imports",
      description: "Import jobs require investigation and retry.",
      count: input.importEngine.failedImports,
      severity: "critical",
      actionLabel: "View Imports",
      href: "/admin/imports",
    });
    push({
      id: "failed-ai",
      title: "Failed AI Jobs",
      description: "Content generation jobs need attention.",
      count: input.contentFactory.failedJobs,
      severity: "critical",
      actionLabel: "View AI Jobs",
      href: "/admin/content",
    });
    push({
      id: "broken-sitemap",
      title: "Broken Sitemap Entries",
      description: "Validation errors detected in staged import records.",
      count: input.brokenSitemap,
      severity: "warning",
      actionLabel: "Inspect Records",
      href: "/admin/imports/review",
    });
    push({
      id: "duplicates",
      title: "Duplicate Projects",
      description: "Potential duplicate listings need merge or rejection.",
      count: input.importEngine.duplicateProjects,
      severity: "warning",
      actionLabel: "Resolve Duplicates",
      href: "/admin/imports/review",
    });

    return items.sort((a, b) => {
      const severityRank = { critical: 0, warning: 1 };
      return severityRank[a.severity] - severityRank[b.severity];
    });
  },

  buildSmartNotifications(
    actionRequired: ActionRequiredItem[],
    platformHealth: PlatformServiceHealth[]
  ): MissionControlAlert[] {
    const notifications: MissionControlAlert[] = actionRequired.map((item) => ({
      id: item.id,
      severity: item.severity,
      title: item.title,
      description: `${item.count} item(s) — ${item.description}`,
      href: item.href,
    }));

    for (const service of platformHealth) {
      if (service.status === "offline") {
        notifications.push({
          id: `offline-${service.id}`,
          severity: service.id === "mongodb" ? "critical" : "warning",
          title: `${service.label} Offline`,
          description: service.detail,
        });
      }
    }

    return notifications.slice(0, 10);
  },

  buildGlobalHealthReport(
    input: ExecutiveBuildInput,
    dataQuality: DataQualityMetrics,
    readiness: PlatformReadinessScore
  ): GlobalHealthReport {
    const row = (
      id: string,
      label: string,
      score: number,
      summary: string
    ): GlobalHealthReportRow => ({
      id,
      label,
      score,
      level: scoreToReadinessLevel(score),
      summary,
    });

    const crmScore = input.crm.leadsThisMonth
      ? Math.min(100, input.crm.conversionRate + 40)
      : 50;

    const rows: GlobalHealthReportRow[] = [
      row(
        "infrastructure",
        "Infrastructure",
        readiness.dimensions[READINESS_DIMENSION_LABELS.infrastructureHealth]?.score ?? 0,
        `${input.platformHealth.filter((s) => s.status === "online").length}/${input.platformHealth.length} services online`
      ),
      row(
        "import-engine",
        "Import Engine",
        input.importEngine.successRate,
        `${input.importEngine.importsToday} imports today · ${input.importEngine.failedImports} failed`
      ),
      row(
        "project-factory",
        "Project Factory",
        input.snapshot.avgCompletionPercent,
        `${input.projectFactory.publishedProjects} published · avg ${input.snapshot.avgCompletionPercent}% complete`
      ),
      row(
        "content-factory",
        "Content Factory",
        readiness.dimensions[READINESS_DIMENSION_LABELS.contentEngine]?.score ?? 0,
        `${input.contentFactory.published} published · ${input.contentFactory.failedJobs} failed jobs`
      ),
      row(
        "seo",
        "SEO",
        readiness.dimensions[READINESS_DIMENSION_LABELS.seo]?.score ?? 0,
        `${input.seoCenter.missingSeo} entities missing metadata`
      ),
      row(
        "location",
        "Location Intelligence",
        input.snapshot.poiCompletePercent,
        `${input.snapshot.projectsMissingPoi} projects missing POI`
      ),
      row(
        "media",
        "Media",
        input.snapshot.mediaCompletePercent,
        `${input.mediaCenter.projectsMissingMedia} projects missing gallery`
      ),
      row(
        "crm",
        "CRM",
        crmScore,
        `${input.crm.leadsToday} leads today · ${input.crm.conversionRate}% conversion`
      ),
      row(
        "ai",
        "AI Modules",
        readiness.dimensions[READINESS_DIMENSION_LABELS.aiModules]?.score ?? 0,
        `${input.aiCenter.queueDepth} jobs in queue`
      ),
      row(
        "data-quality",
        "Data Quality",
        dataQuality.score,
        `${dataQuality.duplicateProjects} duplicates · ${dataQuality.missingMandatoryFields} incomplete records`
      ),
    ];

    return {
      rows,
      overall: readiness.overall,
      overallLevel: readiness.level,
    };
  },

  async getBuilderPerformance(): Promise<BuilderPerformanceRow[]> {
    return withDatabase(async () => {
      const [jobStats, projectStats, builderDocs, publishStats] = await Promise.all([
        ImportJob.aggregate<{
          _id: string;
          total: number;
          failed: number;
          success: number;
          lastImport: Date;
          avgMs: number | null;
        }>([
          { $match: { builderSlug: { $exists: true, $ne: "" } } },
          {
            $group: {
              _id: "$builderSlug",
              total: { $sum: 1 },
              failed: {
                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
              },
              success: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$status",
                        ["completed", "published", "pending_review"],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              lastImport: { $max: "$createdAt" },
              avgMs: {
                $avg: {
                  $cond: [
                    {
                      $and: [
                        { $ifNull: ["$startedAt", false] },
                        { $ifNull: ["$completedAt", false] },
                      ],
                    },
                    { $subtract: ["$completedAt", "$startedAt"] },
                    null,
                  ],
                },
              },
            },
          },
        ]),
        Project.aggregate<{ _id: string; total: number; published: number }>([
          {
            $group: {
              _id: "$builderName",
              total: { $sum: 1 },
              published: { $sum: { $cond: ["$isActive", 1, 0] } },
            },
          },
        ]),
        Builder.find().select("slug name logoUrl").lean(),
        ImportRecord.aggregate<{ _id: string; lastPublish: Date }>([
          { $match: { status: "published" } },
          {
            $group: {
              _id: "$stagedData.project.builderSlug",
              lastPublish: { $max: "$reviewedAt" },
            },
          },
        ]),
      ]);

      const jobMap = new Map(jobStats.map((row) => [row._id, row]));
      const projectMap = new Map(projectStats.map((row) => [row._id, row]));
      const builderMap = new Map(builderDocs.map((b) => [String(b.slug), b]));
      const publishMap = new Map(
        publishStats.filter((row) => row._id).map((row) => [String(row._id), row])
      );

      const rows: BuilderPerformanceRow[] = SUPPORTED_BUILDERS.map((config) => {
        const jobs = jobMap.get(config.slug);
        const projects = projectMap.get(config.name);
        const builder = builderMap.get(config.slug);
        const publish = publishMap.get(config.slug);
        const totalJobs = jobs?.total ?? 0;
        const successRate = totalJobs
          ? Math.round(((jobs?.success ?? 0) / totalJobs) * 100)
          : 0;
        const failedImports = jobs?.failed ?? 0;
        const reliabilityScore = Math.max(
          0,
          successRate - Math.min(30, failedImports * 5)
        );

        return {
          rank: 0,
          slug: config.slug,
          name: config.name,
          logoUrl: builder?.logoUrl ? String(builder.logoUrl) : undefined,
          totalProjects: projects?.total ?? 0,
          publishedProjects: projects?.published ?? 0,
          successRate,
          lastImport: jobs?.lastImport
            ? new Date(jobs.lastImport).toISOString()
            : null,
          lastPublish: publish?.lastPublish
            ? new Date(publish.lastPublish).toISOString()
            : null,
          failedImports,
          averageProcessingTimeMs: jobs?.avgMs ? Math.round(jobs.avgMs) : null,
          reliabilityScore,
        };
      });

      rows.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
      return rows.map((row, index) => ({ ...row, rank: index + 1 }));
    });
  },

  async getLocalityCoverage(
    snapshot: ProjectAnalyticsSnapshot
  ): Promise<LocalityCoverageMetrics> {
    return withDatabase(async () => {
      const [locations, blogByLocation, leadByLocation, poiByLocation] =
        await Promise.all([
          Location.find({ isActive: true }).select("slug name").lean(),
          ContentArticle.aggregate<{ _id: unknown; count: number }>([
            {
              $match: {
                locationId: { $exists: true, $ne: null },
                status: "published",
              },
            },
            { $group: { _id: "$locationId", count: { $sum: 1 } } },
          ]),
          Lead.aggregate<{ _id: unknown; count: number }>([
            { $match: { locationId: { $exists: true, $ne: null } } },
            { $group: { _id: "$locationId", count: { $sum: 1 } } },
          ]),
          NearbyPlace.aggregate<{ _id: unknown; count: number }>([
            { $match: { isActive: true, locationId: { $exists: true, $ne: null } } },
            { $group: { _id: "$locationId", count: { $sum: 1 } } },
          ]),
        ]);

      const projectByLocation = new Map<string, number>();

      for (const row of snapshot.rows) {
        const key = row.locationId ?? row.locationName ?? "unknown";
        projectByLocation.set(key, (projectByLocation.get(key) ?? 0) + 1);
      }

      const blogMap = new Map(blogByLocation.map((r) => [String(r._id), r.count]));
      const leadMap = new Map(leadByLocation.map((r) => [String(r._id), r.count]));
      const poiMap = new Map(poiByLocation.map((r) => [String(r._id), r.count]));

      const byLocality = locations.map((loc) => {
        const id = String(loc._id);
        const projects = projectByLocation.get(id) ?? 0;
        const blogs = blogMap.get(id) ?? 0;
        const leads = leadMap.get(id) ?? 0;
        const nearbyPlaces = poiMap.get(id) ?? 0;
        const coverageScore = Math.min(
          100,
          projects * 20 + blogs * 10 + leads * 5 + Math.min(nearbyPlaces, 10)
        );

        return {
          slug: String(loc.slug),
          name: String(loc.name),
          projects,
          blogs,
          leads,
          nearbyPlaces,
          coverageScore,
        };
      });

      byLocality.sort((a, b) => b.projects - a.projects);

      const missingLocalities = locations
        .filter((loc) => !projectByLocation.get(String(loc._id)))
        .map((loc) => ({ slug: String(loc.slug), name: String(loc.name) }));

      const underservedMarkets = byLocality
        .filter((row) => row.projects > 0 && row.coverageScore < 40)
        .slice(0, 8);

      return { byLocality, missingLocalities, underservedMarkets };
    });
  },

  async getExecutiveTimeline(limit: number): Promise<ExecutiveTimelineItem[]> {
    return withDatabase(async () => {
      const [
        importJobs,
        importLogs,
        publishedRecords,
        approvedRecords,
        articles,
        audits,
        leads,
      ] = await Promise.all([
        ImportJob.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .select("builderSlug status createdAt completedAt")
          .lean(),
        ImportLog.find({ level: "error" })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        ImportRecord.find({ status: "published" })
          .sort({ reviewedAt: -1 })
          .limit(limit)
          .select("displayName slug reviewedAt updatedAt")
          .lean(),
        ImportRecord.find({ status: "approved" })
          .sort({ reviewedAt: -1 })
          .limit(limit)
          .select("displayName slug reviewedAt")
          .lean(),
        ContentArticle.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .select("title slug createdAt status")
          .lean(),
        ContentAuditLog.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .select("action meta createdAt")
          .lean(),
        Lead.find()
          .sort({ createdAt: -1 })
          .limit(limit)
          .select("name source createdAt")
          .lean(),
      ]);

      const items: ExecutiveTimelineItem[] = [
        ...importJobs.map((job) => ({
          id: `job-start-${job._id}`,
          eventType: "import_started",
          type: "import_started",
          title: "Import Started",
          description: `${job.builderSlug ?? "builder"} · ${job.status}`,
          timestamp: new Date(job.createdAt).toISOString(),
        })),
        ...importJobs
          .filter((job) => job.completedAt)
          .map((job) => ({
            id: `job-done-${job._id}`,
            eventType:
              job.status === "failed" ? "error" : "import_completed",
            type: job.status === "failed" ? "error" : "import_completed",
            title:
              job.status === "failed" ? "Import Failed" : "Import Completed",
            description: `${job.builderSlug ?? "builder"} · ${job.status}`,
            timestamp: new Date(job.completedAt!).toISOString(),
          })),
        ...approvedRecords.map((record) => ({
          id: `review-${record._id}`,
          eventType: "review_approved",
          type: "review_approved",
          title: "Review Approved",
          description: String(record.displayName ?? record.slug),
          timestamp: record.reviewedAt
            ? new Date(record.reviewedAt).toISOString()
            : new Date().toISOString(),
        })),
        ...publishedRecords.map((record) => ({
          id: `pub-${record._id}`,
          eventType: "project_published",
          type: "project_published",
          title: "Project Published",
          description: String(record.displayName ?? record.slug),
          timestamp: record.reviewedAt
            ? new Date(record.reviewedAt).toISOString()
            : new Date(record.updatedAt).toISOString(),
        })),
        ...publishedRecords.map((record) => ({
          id: `landing-${record._id}`,
          eventType: "landing_page_created",
          type: "landing_page_created",
          title: "Landing Page Created",
          description: String(record.slug),
          timestamp: record.reviewedAt
            ? new Date(record.reviewedAt).toISOString()
            : new Date(record.updatedAt).toISOString(),
        })),
        ...articles.map((article) => ({
          id: `blog-${article._id}`,
          eventType: "blog_generated",
          type: "blog_generated",
          title: "Blog Generated",
          description: String(article.title),
          timestamp: new Date(article.createdAt).toISOString(),
        })),
        ...audits
          .filter((audit) =>
            String(audit.action).match(/seo|sitemap|schema/i)
          )
          .map((audit) => ({
            id: `audit-${audit._id}`,
            eventType: String(audit.action).includes("sitemap")
              ? "sitemap_updated"
              : "seo_generated",
            type: String(audit.action).includes("sitemap")
              ? "sitemap_updated"
              : "seo_generated",
            title: String(audit.action).includes("sitemap")
              ? "Sitemap Updated"
              : "SEO Generated",
            description: audit.meta
              ? JSON.stringify(audit.meta).slice(0, 100)
              : "Content engine update",
            timestamp: new Date(audit.createdAt).toISOString(),
          })),
        ...leads.map((lead) => ({
          id: `lead-${lead._id}`,
          eventType: "lead_received",
          type: "lead_received",
          title: "Lead Received",
          description: `${lead.name} · ${lead.source}`,
          timestamp: new Date(lead.createdAt).toISOString(),
        })),
        ...importLogs.map((log) => ({
          id: `err-${log._id}`,
          eventType: "error",
          type: "error",
          title: "Error Logged",
          description: String(log.message),
          timestamp: new Date(log.createdAt).toISOString(),
        })),
      ];

      return items
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    });
  },
};
