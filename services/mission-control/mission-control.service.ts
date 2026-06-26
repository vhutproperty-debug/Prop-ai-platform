import {
  CONTENT_FACTORY_LABELS,
  JOB_STATUS_TO_STAGE,
  MISSION_CONTROL_PIPELINE_STAGES,
} from "@/config/mission-control";
import { SUPPORTED_BUILDERS } from "@/config/builders";
import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import { Location } from "@/models/Location";
import { ContentArticle } from "@/models/ContentArticle";
import { ContentJob } from "@/models/ContentJob";
import { ContentAuditLog } from "@/models/ContentAuditLog";
import { NearbyPlace } from "@/models/NearbyPlace";
import { Image } from "@/models/Image";
import { Lead } from "@/models/Lead";
import { User } from "@/models/User";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ImportLog } from "@/models/ImportLog";
import { Embedding } from "@/models/Embedding";
import { siteSitemapService } from "@/services/sitemap/site-sitemap.service";
import { platformHealthService } from "@/services/mission-control/platform-health.service";
import { projectAnalyticsService } from "@/services/mission-control/project-analytics.service";
import { executiveIntelligenceService } from "@/services/mission-control/executive-intelligence.service";
import type {
  ActivityTimelineItem,
  BuilderManagementRow,
  ContentFactoryMetrics,
  CrmMetrics,
  ImportEngineMetrics,
  LiveImportPipelineItem,
  LocationIntelligenceMetrics,
  MediaCenterMetrics,
  MissionControlAlert,
  MissionControlDashboardData,
  MissionControlFilter,
  MissionControlKpis,
  ProjectFactoryMetrics,
  RevenueMetrics,
  SearchIntelligenceMetrics,
  SeoCenterMetrics,
  ServiceHealthStatus,
  AiCenterMetrics,
} from "@/types/mission-control";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function stageProgress(stageId: string): number {
  const idx = MISSION_CONTROL_PIPELINE_STAGES.findIndex((s) => s.id === stageId);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / MISSION_CONTROL_PIPELINE_STAGES.length) * 100);
}

function buildDateFilter(filter?: MissionControlFilter) {
  const query: Record<string, unknown> = {};
  if (filter?.from || filter?.to) {
    query.createdAt = {};
    if (filter.from) (query.createdAt as Record<string, Date>).$gte = new Date(filter.from);
    if (filter.to) (query.createdAt as Record<string, Date>).$lte = new Date(filter.to);
  }
  return query;
}

export const missionControlService = {
  async getDashboard(filter?: MissionControlFilter): Promise<MissionControlDashboardData> {
    const today = startOfDay();
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);
    const dateFilter = buildDateFilter(filter);

    const [
      snapshot,
      kpis,
      platformHealth,
      importEngine,
      livePipeline,
      builders,
      contentFactory,
      seoCenter,
      mediaCenter,
      searchIntelligence,
      aiCenter,
      crm,
      activity,
    ] = await Promise.all([
      projectAnalyticsService.buildSnapshot(),
      this.getKpis(today),
      platformHealthService.getAll(),
      this.getImportEngine(today, weekAgo, filter),
      this.getLivePipeline(filter),
      this.getBuilderManagement(),
      this.getContentFactory(),
      this.getSeoCenter(),
      this.getMediaCenter(),
      this.getSearchIntelligence(),
      this.getAiCenter(),
      this.getCrmMetrics(today, weekAgo, monthAgo),
      this.getActivity(40, dateFilter),
    ]);

    const projectFactory = projectAnalyticsService.toProjectFactoryMetrics(snapshot);
    const locationIntelligence =
      projectAnalyticsService.toLocationIntelligenceMetrics(snapshot);

    const alerts = this.buildAlerts({
      kpis,
      importEngine,
      projectFactory,
      contentFactory,
      seoCenter,
      locationIntelligence,
      mediaCenter,
      platformHealth,
    });

    const revenue = this.getRevenuePlaceholder(kpis);

    const executive = await executiveIntelligenceService.build({
      today,
      snapshot,
      kpis,
      platformHealth,
      importEngine,
      projectFactory,
      contentFactory,
      seoCenter,
      mediaCenter,
      aiCenter,
      crm,
      alerts,
    });

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      platformHealth,
      importEngine,
      livePipeline,
      pipelineStages: MISSION_CONTROL_PIPELINE_STAGES,
      builders,
      projectFactory,
      contentFactory,
      seoCenter,
      locationIntelligence,
      mediaCenter,
      searchIntelligence,
      aiCenter,
      crm,
      revenue,
      alerts,
      activity,
      executive,
    };
  },

  async getKpis(today: Date): Promise<MissionControlKpis> {
    return withDatabase(async () => {
      const [
        totalBuilders,
        totalProjects,
        totalLocalities,
        totalLandingPages,
        totalBlogArticles,
        totalNearbyPlaces,
        totalImages,
        totalLeads,
        activeUsers,
        todaysImports,
        pendingReviews,
        failedJobs,
      ] = await Promise.all([
        Builder.countDocuments({ isActive: true }),
        Project.countDocuments(),
        Location.countDocuments({ isActive: true }),
        Project.countDocuments({ isActive: true }),
        ContentArticle.countDocuments(),
        NearbyPlace.countDocuments({ isActive: true }),
        Image.countDocuments({ isActive: true }),
        Lead.countDocuments(),
        User.countDocuments({ role: { $in: ["admin", "agent", "builder"] } }),
        ImportJob.countDocuments({ createdAt: { $gte: today } }),
        ImportRecord.countDocuments({
          status: { $in: ["staged", "duplicate", "update", "conflict", "approved"] },
        }),
        Promise.all([
          ImportJob.countDocuments({ status: "failed" }),
          ContentJob.countDocuments({ status: "failed" }),
        ]).then(([a, b]) => a + b),
      ]);

      return {
        totalBuilders,
        totalProjects,
        totalLocalities,
        totalLandingPages,
        totalBlogArticles,
        totalNearbyPlaces,
        totalImages,
        totalLeads,
        activeUsers,
        todaysImports,
        pendingReviews,
        failedJobs,
      };
    });
  },

  async getImportEngine(
    today: Date,
    weekAgo: Date,
    filter?: MissionControlFilter
  ): Promise<ImportEngineMetrics> {
    return withDatabase(async () => {
      const jobFilter: Record<string, unknown> = { ...buildDateFilter(filter) };
      if (filter?.builderSlug) jobFilter.builderSlug = filter.builderSlug;

      const [
        importsToday,
        importsThisWeek,
        successfulImports,
        failedImports,
        duplicateProjects,
        pendingReviews,
        publishedProjects,
        perDayRaw,
        perBuilderRaw,
      ] = await Promise.all([
        ImportJob.countDocuments({ createdAt: { $gte: today }, ...jobFilter }),
        ImportJob.countDocuments({ createdAt: { $gte: weekAgo }, ...jobFilter }),
        ImportJob.countDocuments({
          status: { $in: ["completed", "published", "pending_review"] },
          ...jobFilter,
        }),
        ImportJob.countDocuments({ status: "failed", ...jobFilter }),
        ImportRecord.countDocuments({ recordType: "duplicate" }),
        ImportRecord.countDocuments({
          status: { $in: ["staged", "approved", "duplicate", "update", "conflict"] },
        }),
        ImportRecord.countDocuments({ status: "published" }),
        ImportJob.aggregate([
          { $match: { createdAt: { $gte: daysAgo(14) }, ...jobFilter } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        ImportJob.aggregate([
          { $match: { createdAt: { $gte: weekAgo }, ...jobFilter } },
          { $group: { _id: "$builderSlug", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

      const total = successfulImports + failedImports;
      const successRate = total ? Math.round((successfulImports / total) * 100) : 0;
      const failureRate = total ? Math.round((failedImports / total) * 100) : 0;

      const activeBuilderSlugs = await ImportJob.distinct("builderSlug", {
        createdAt: { $gte: weekAgo },
      });

      return {
        buildersConfigured: SUPPORTED_BUILDERS.length,
        activeBuilders: activeBuilderSlugs.filter(Boolean).length,
        scheduledImports: 0,
        importsToday,
        importsThisWeek,
        successfulImports,
        failedImports,
        duplicateProjects,
        pendingReviews,
        publishedProjects,
        importsPerDay: perDayRaw.map((row) => ({
          date: String(row._id),
          count: row.count as number,
        })),
        importsPerBuilder: perBuilderRaw.map((row) => ({
          builder: String(row._id ?? "unknown"),
          count: row.count as number,
        })),
        successRate,
        failureRate,
      };
    });
  },

  async getLivePipeline(filter?: MissionControlFilter): Promise<LiveImportPipelineItem[]> {
    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        status: {
          $in: ["queued", "running", "extracting", "normalizing", "validating", "publishing"],
        },
      };
      if (filter?.builderSlug) query.builderSlug = filter.builderSlug;

      const jobs = await ImportJob.find(query)
        .sort({ startedAt: -1 })
        .limit(12)
        .lean();

      const jobIds = jobs.map((job) => job._id);
      const records = jobIds.length
        ? await ImportRecord.find({ jobId: { $in: jobIds } })
            .sort({ createdAt: -1 })
            .select("jobId displayName slug status")
            .lean()
        : [];

      const recordByJob = new Map<string, (typeof records)[number]>();
      for (const record of records) {
        const key = String(record.jobId);
        if (!recordByJob.has(key)) recordByJob.set(key, record);
      }

      const items: LiveImportPipelineItem[] = [];

      for (const job of jobs) {
        const record = recordByJob.get(String(job._id));

        const stageId = JOB_STATUS_TO_STAGE[String(job.status)] ?? "firecrawl";
        const stage = MISSION_CONTROL_PIPELINE_STAGES.find((s) => s.id === stageId);

        items.push({
          jobId: String(job._id),
          builder: String(job.builder ?? job.builderSlug ?? "Unknown"),
          project: record?.displayName ?? "Processing…",
          currentStage: stage?.label ?? stageId,
          currentStageId: stageId,
          progress: stageProgress(stageId),
          status: String(job.status),
          startedAt: job.startedAt
            ? new Date(job.startedAt).toISOString()
            : new Date(job.createdAt).toISOString(),
        });
      }

      return items;
    });
  },

  async getBuilderManagement(): Promise<BuilderManagementRow[]> {
    return withDatabase(async () => {
      const rows: BuilderManagementRow[] = [];

      for (const config of SUPPORTED_BUILDERS) {
        const [projectCount, jobs, builderDoc] = await Promise.all([
          Project.countDocuments({ builderName: config.name, isActive: true }),
          ImportJob.find({ builderSlug: config.slug })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
          Builder.findOne({ slug: config.slug }).select("logoUrl logo name").lean(),
        ]);

        const lastImport = jobs[0]?.createdAt
          ? new Date(jobs[0].createdAt).toISOString()
          : null;
        const lastSuccess = jobs.find((j) =>
          ["completed", "published", "pending_review"].includes(String(j.status))
        );
        const lastFailure = jobs.find((j) => j.status === "failed");

        const successCount = jobs.filter((j) =>
          ["completed", "published", "pending_review"].includes(String(j.status))
        ).length;
        const successRate = jobs.length
          ? Math.round((successCount / jobs.length) * 100)
          : 0;

        const durations = jobs
          .filter((j) => j.startedAt && j.completedAt)
          .map(
            (j) =>
              new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime()
          );
        const averageImportTimeMs = durations.length
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null;

        let importStatus: ServiceHealthStatus = "warning";
        if (lastFailure && (!lastSuccess || lastFailure.createdAt! > lastSuccess.createdAt!)) {
          importStatus = "warning";
        } else if (successRate >= 70) {
          importStatus = "online";
        } else if (jobs.length === 0) {
          importStatus = "offline";
        }

        rows.push({
          slug: config.slug,
          name: config.name,
          logoUrl: builderDoc?.logoUrl ? String(builderDoc.logoUrl) : undefined,
          projects: projectCount,
          lastImport,
          lastSuccess: lastSuccess?.completedAt
            ? new Date(lastSuccess.completedAt).toISOString()
            : lastSuccess?.createdAt
              ? new Date(lastSuccess.createdAt).toISOString()
              : null,
          lastFailure: lastFailure?.completedAt
            ? new Date(lastFailure.completedAt).toISOString()
            : lastFailure?.createdAt
              ? new Date(lastFailure.createdAt).toISOString()
              : null,
          successRate,
          averageImportTimeMs,
          importStatus,
        });
      }

      return rows;
    });
  },

  async getContentFactory(): Promise<ContentFactoryMetrics> {
    return withDatabase(async () => {
      const breakdown: Record<string, number> = {};
      for (const key of Object.keys(CONTENT_FACTORY_LABELS)) {
        breakdown[key] = 0;
      }

      const typeCounts = await ContentArticle.aggregate([
        { $group: { _id: "$contentType", count: { $sum: 1 } } },
      ]);
      for (const row of typeCounts) {
        breakdown[String(row._id)] = row.count as number;
      }

      const [articlesGenerated, published, drafts, scheduled, aiJobs, failedJobs] =
        await Promise.all([
          ContentArticle.countDocuments(),
          ContentArticle.countDocuments({ status: "published" }),
          ContentArticle.countDocuments({ status: { $in: ["draft", "pending_review"] } }),
          ContentArticle.countDocuments({ status: "scheduled" }),
          ContentJob.countDocuments(),
          ContentJob.countDocuments({ status: "failed" }),
        ]);

      return {
        articlesGenerated,
        published,
        drafts,
        scheduled,
        aiJobs,
        failedJobs,
        breakdown,
      };
    });
  },

  async getSeoCenter(): Promise<SeoCenterMetrics> {
    const sitemapEntries = await siteSitemapService.buildAllEntries().catch(() => []);

    return withDatabase(async () => {
      const [projects, articles] = await Promise.all([
        Project.find({ isActive: true })
          .select("seoTitle seoDescription slug")
          .lean(),
        ContentArticle.find({ status: "published" })
          .select("metaTitle metaDescription canonicalUrl schemaData internalLinks slug")
          .lean(),
      ]);

      const projectTitles = projects.filter((p) => p.seoTitle).length;
      const projectDescs = projects.filter((p) => p.seoDescription).length;
      const articleTitles = articles.filter((a) => a.metaTitle).length;
      const articleDescs = articles.filter((a) => a.metaDescription).length;
      const schemaGenerated = articles.filter((a) => a.schemaData).length;
      const canonicals =
        articles.filter((a) => a.canonicalUrl).length + projects.length;
      const internalLinks = articles.reduce(
        (sum, a) => sum + (a.internalLinks?.length ?? 0),
        0
      );
      const missingSeo =
        projects.filter((p) => !p.seoTitle || !p.seoDescription).length +
        articles.filter((a) => !a.metaTitle || !a.metaDescription).length;

      return {
        metaTitles: projectTitles + articleTitles,
        metaDescriptions: projectDescs + articleDescs,
        schemaGenerated,
        sitemapEntries: sitemapEntries.length,
        canonicals,
        internalLinks,
        missingSeo,
        redirectIssues: 0,
      };
    });
  },

  async getMediaCenter(): Promise<MediaCenterMetrics> {
    return withDatabase(async () => {
      const [images, floorPlans, brochures] = await Promise.all([
        Image.countDocuments({ type: "gallery", isActive: true }),
        Image.countDocuments({ type: "floorplan", isActive: true }),
        Image.countDocuments({ type: "brochure", isActive: true }),
      ]);

      const projectsMissingMedia = await Project.countDocuments({
        isActive: true,
        $or: [{ gallery: { $size: 0 } }, { gallery: { $exists: false } }],
      });

      return {
        images,
        floorPlans,
        brochures,
        videos: 0,
        virtualTours: 0,
        projectsMissingMedia,
      };
    });
  },

  async getSearchIntelligence(): Promise<SearchIntelligenceMetrics> {
    return withDatabase(async () => {
      const [indexedProjects, indexedBlogs, embeddingsGenerated, activeProjects] =
        await Promise.all([
          Embedding.countDocuments({ entityType: "project" }),
          Embedding.countDocuments({ entityType: "article" }),
          Embedding.countDocuments({ embedding: { $ne: [] } }),
          Project.countDocuments({ isActive: true }),
        ]);

      return {
        indexedProjects,
        indexedBlogs,
        embeddingsGenerated,
        projectsWaitingForIndexing: Math.max(0, activeProjects - indexedProjects),
        searchQueriesToday: 0,
        topSearches: [],
      };
    });
  },

  async getAiCenter(): Promise<AiCenterMetrics> {
    return withDatabase(async () => {
      const [aiJobs, contentGeneration, queueDepth, failed, embeddingCount] =
        await Promise.all([
          ContentJob.countDocuments(),
          ContentJob.countDocuments({
            type: { $in: ["generate", "bulk_generate", "research"] },
          }),
          ContentJob.countDocuments({ status: { $in: ["queued", "running"] } }),
          ContentJob.countDocuments({ status: "failed" }),
          Embedding.countDocuments({ embedding: { $ne: [] } }),
        ]);

      const moduleStatus = (active: boolean): ServiceHealthStatus =>
        active ? (failed > 3 ? "warning" : "online") : "offline";

      return {
        aiJobs,
        contentGeneration,
        recommendationEngine: "offline",
        embeddings: moduleStatus(embeddingCount > 0),
        semanticSearch: "online",
        aiAssistant: "offline",
        brokerCopilot: "offline",
        queueDepth,
      };
    });
  },

  async getCrmMetrics(
    today: Date,
    weekAgo: Date,
    monthAgo: Date
  ): Promise<CrmMetrics> {
    return withDatabase(async () => {
      const [leadsToday, leadsThisWeek, leadsThisMonth, totalLeads, converted] =
        await Promise.all([
          Lead.countDocuments({ createdAt: { $gte: today } }),
          Lead.countDocuments({ createdAt: { $gte: weekAgo } }),
          Lead.countDocuments({ createdAt: { $gte: monthAgo } }),
          Lead.countDocuments(),
          Lead.countDocuments({ status: { $in: ["closed_won", "qualified"] } }),
        ]);

      const [projectWise, builderWise, siteVisits, whatsapp] = await Promise.all([
        Lead.aggregate([
          { $match: { projectSlug: { $exists: true, $ne: "" } } },
          { $group: { _id: "$projectSlug", count: { $sum: 1 }, name: { $first: "$projectName" } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        Lead.aggregate([
          { $match: { builderName: { $exists: true, $ne: "" } } },
          { $group: { _id: "$builderName", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
        Lead.countDocuments({ status: "site_visit" }),
        Lead.countDocuments({ source: "whatsapp" }),
      ]);

      return {
        leadsToday,
        leadsThisWeek,
        leadsThisMonth,
        projectWiseLeads: projectWise.map((row) => ({
          slug: String(row._id),
          name: String(row.name ?? row._id),
          count: row.count as number,
        })),
        builderWiseLeads: builderWise.map((row) => ({
          name: String(row._id),
          count: row.count as number,
        })),
        conversionRate: totalLeads ? Math.round((converted / totalLeads) * 100) : 0,
        siteVisitRequests: siteVisits,
        whatsappEnquiries: whatsapp,
      };
    });
  },

  getRevenuePlaceholder(kpis: MissionControlKpis): RevenueMetrics {
    return {
      activeListings: kpis.totalLandingPages,
      premiumListings: 0,
      leadValue: 0,
      estimatedCommissionPipeline: 0,
      closedDeals: 0,
      monthlyRevenue: 0,
      isPlaceholder: true,
    };
  },

  buildAlerts(input: {
    kpis: MissionControlKpis;
    importEngine: ImportEngineMetrics;
    projectFactory: ProjectFactoryMetrics;
    contentFactory: ContentFactoryMetrics;
    seoCenter: SeoCenterMetrics;
    locationIntelligence: LocationIntelligenceMetrics;
    mediaCenter: MediaCenterMetrics;
    platformHealth: { id: string; status: ServiceHealthStatus; label: string }[];
  }): MissionControlAlert[] {
    const alerts: MissionControlAlert[] = [];

    if (input.importEngine.failedImports > 0) {
      alerts.push({
        id: "failed-imports",
        severity: "critical",
        title: "Failed Imports",
        description: `${input.importEngine.failedImports} import job(s) failed`,
        href: "/admin/imports",
      });
    }
    if (input.contentFactory.failedJobs > 0) {
      alerts.push({
        id: "failed-ai",
        severity: "warning",
        title: "Failed AI Jobs",
        description: `${input.contentFactory.failedJobs} content job(s) failed`,
        href: "/admin/content",
      });
    }
    if (input.projectFactory.missing.images > 0) {
      alerts.push({
        id: "missing-images",
        severity: "warning",
        title: "Missing Images",
        description: `${input.projectFactory.missing.images} projects without gallery`,
        href: "/admin/projects",
      });
    }
    if (input.importEngine.duplicateProjects > 0) {
      alerts.push({
        id: "duplicates",
        severity: "info",
        title: "Duplicate Projects",
        description: `${input.importEngine.duplicateProjects} duplicate records detected`,
        href: "/admin/imports/review",
      });
    }
    if (input.seoCenter.missingSeo > 0) {
      alerts.push({
        id: "missing-seo",
        severity: "warning",
        title: "Missing SEO",
        description: `${input.seoCenter.missingSeo} entities need SEO metadata`,
        href: "/admin/content",
      });
    }
    if (input.projectFactory.missing.floorPlans > 0) {
      alerts.push({
        id: "missing-floorplans",
        severity: "info",
        title: "Missing Floor Plans",
        description: `${input.projectFactory.missing.floorPlans} projects without floor plans`,
        href: "/admin/projects",
      });
    }
    if (input.locationIntelligence.projectsMissingPoi > 0) {
      alerts.push({
        id: "missing-poi",
        severity: "info",
        title: "Missing POI Data",
        description: `${input.locationIntelligence.projectsMissingPoi} projects without nearby places`,
        href: "/admin/nearby-places",
      });
    }

    for (const service of input.platformHealth) {
      if (service.status === "offline") {
        alerts.push({
          id: `service-${service.id}`,
          severity: service.id === "mongodb" ? "critical" : "warning",
          title: `${service.label} Offline`,
          description: "Service unavailable or not configured",
        });
      }
    }

    if (input.kpis.pendingReviews > 0) {
      alerts.push({
        id: "pending-reviews",
        severity: "info",
        title: "Pending Reviews",
        description: `${input.kpis.pendingReviews} import(s) awaiting review`,
        href: "/admin/imports/review",
      });
    }

    return alerts.slice(0, 12);
  },

  async getActivity(
    limit: number,
    dateFilter: Record<string, unknown>
  ): Promise<ActivityTimelineItem[]> {
    return withDatabase(async () => {
      const [logs, audits, leads, publishedRecords] = await Promise.all([
        ImportLog.find(dateFilter).sort({ createdAt: -1 }).limit(limit).lean(),
        ContentAuditLog.find(dateFilter).sort({ createdAt: -1 }).limit(limit).lean(),
        Lead.find(dateFilter).sort({ createdAt: -1 }).limit(limit).lean(),
        ImportRecord.find({ status: "published", ...dateFilter })
          .sort({ reviewedAt: -1 })
          .limit(limit)
          .lean(),
      ]);

      const items: ActivityTimelineItem[] = [
        ...logs.map((log) => ({
          id: String(log._id),
          type: log.level === "error" ? "error_logged" : "import_event",
          title: log.level === "error" ? "Error Logged" : "Import Event",
          description: String(log.message),
          timestamp: new Date(log.createdAt).toISOString(),
        })),
        ...audits.map((audit) => ({
          id: String(audit._id),
          type: String(audit.action),
          title: String(audit.action).replace(/_/g, " "),
          description: audit.meta ? JSON.stringify(audit.meta).slice(0, 120) : "Content engine event",
          timestamp: new Date(audit.createdAt).toISOString(),
        })),
        ...leads.map((lead) => ({
          id: String(lead._id),
          type: "lead_received",
          title: "Lead Received",
          description: `${lead.name} · ${lead.source}`,
          timestamp: new Date(lead.createdAt).toISOString(),
        })),
        ...publishedRecords.map((record) => ({
          id: String(record._id),
          type: "project_published",
          title: "Project Published",
          description: String(record.displayName ?? record.slug),
          timestamp: record.reviewedAt
            ? new Date(record.reviewedAt).toISOString()
            : new Date(record.updatedAt).toISOString(),
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
