export type ServiceHealthStatus = "online" | "warning" | "offline";

export type MissionControlFilter = {
  builderSlug?: string;
  localitySlug?: string;
  status?: string;
  from?: string;
  to?: string;
};

export interface MissionControlKpis {
  totalBuilders: number;
  totalProjects: number;
  totalLocalities: number;
  totalLandingPages: number;
  totalBlogArticles: number;
  totalNearbyPlaces: number;
  totalImages: number;
  totalLeads: number;
  activeUsers: number;
  todaysImports: number;
  pendingReviews: number;
  failedJobs: number;
}

export interface PlatformServiceHealth {
  id: string;
  label: string;
  status: ServiceHealthStatus;
  detail: string;
}

export interface ImportEngineMetrics {
  buildersConfigured: number;
  activeBuilders: number;
  scheduledImports: number;
  importsToday: number;
  importsThisWeek: number;
  successfulImports: number;
  failedImports: number;
  duplicateProjects: number;
  pendingReviews: number;
  publishedProjects: number;
  importsPerDay: Array<{ date: string; count: number }>;
  importsPerBuilder: Array<{ builder: string; count: number }>;
  successRate: number;
  failureRate: number;
}

export interface PipelineStage {
  id: string;
  label: string;
}

export interface LiveImportPipelineItem {
  jobId: string;
  builder: string;
  project: string;
  currentStage: string;
  currentStageId: string;
  progress: number;
  status: string;
  startedAt: string;
}

export interface BuilderManagementRow {
  slug: string;
  name: string;
  logoUrl?: string;
  projects: number;
  lastImport: string | null;
  lastSuccess: string | null;
  lastFailure: string | null;
  successRate: number;
  averageImportTimeMs: number | null;
  importStatus: ServiceHealthStatus;
}

export interface ProjectFactoryMetrics {
  projectsImported: number;
  landingPagesGenerated: number;
  publishedProjects: number;
  draftProjects: number;
  archivedProjects: number;
  missing: {
    images: number;
    floorPlans: number;
    nearbyPlaces: number;
    pricing: number;
    amenities: number;
    configurations: number;
  };
}

export interface ContentFactoryMetrics {
  articlesGenerated: number;
  published: number;
  drafts: number;
  scheduled: number;
  aiJobs: number;
  failedJobs: number;
  breakdown: Record<string, number>;
}

export interface SeoCenterMetrics {
  metaTitles: number;
  metaDescriptions: number;
  schemaGenerated: number;
  sitemapEntries: number;
  canonicals: number;
  internalLinks: number;
  missingSeo: number;
  redirectIssues: number;
}

export interface LocationIntelligenceMetrics {
  byType: Record<string, number>;
  projectsMissingPoi: number;
}

export interface MediaCenterMetrics {
  images: number;
  floorPlans: number;
  brochures: number;
  videos: number;
  virtualTours: number;
  projectsMissingMedia: number;
}

export interface SearchIntelligenceMetrics {
  indexedProjects: number;
  indexedBlogs: number;
  embeddingsGenerated: number;
  projectsWaitingForIndexing: number;
  searchQueriesToday: number;
  topSearches: string[];
}

export interface AiCenterMetrics {
  aiJobs: number;
  contentGeneration: number;
  recommendationEngine: ServiceHealthStatus;
  embeddings: ServiceHealthStatus;
  semanticSearch: ServiceHealthStatus;
  aiAssistant: ServiceHealthStatus;
  brokerCopilot: ServiceHealthStatus;
  queueDepth: number;
}

export interface CrmMetrics {
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  projectWiseLeads: Array<{ slug: string; name: string; count: number }>;
  builderWiseLeads: Array<{ name: string; count: number }>;
  conversionRate: number;
  siteVisitRequests: number;
  whatsappEnquiries: number;
}

export interface RevenueMetrics {
  activeListings: number;
  premiumListings: number;
  leadValue: number;
  estimatedCommissionPipeline: number;
  closedDeals: number;
  monthlyRevenue: number;
  isPlaceholder: boolean;
}

export interface MissionControlAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  href?: string;
}

export interface ActivityTimelineItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface MissionControlDashboardData {
  generatedAt: string;
  kpis: MissionControlKpis;
  platformHealth: PlatformServiceHealth[];
  importEngine: ImportEngineMetrics;
  livePipeline: LiveImportPipelineItem[];
  pipelineStages: PipelineStage[];
  builders: BuilderManagementRow[];
  projectFactory: ProjectFactoryMetrics;
  contentFactory: ContentFactoryMetrics;
  seoCenter: SeoCenterMetrics;
  locationIntelligence: LocationIntelligenceMetrics;
  mediaCenter: MediaCenterMetrics;
  searchIntelligence: SearchIntelligenceMetrics;
  aiCenter: AiCenterMetrics;
  crm: CrmMetrics;
  revenue: RevenueMetrics;
  alerts: MissionControlAlert[];
  activity: ActivityTimelineItem[];
  executive: MissionControlExecutiveData;
}

export interface MissionControlSearchResult {
  type: "builder" | "project" | "article" | "locality" | "lead" | "user";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export type ReadinessLevel = "healthy" | "attention" | "critical";

export interface PlatformReadinessScore {
  overall: number;
  level: ReadinessLevel;
  dimensions: Record<string, { score: number; level: ReadinessLevel }>;
}

export interface TodayBusinessSnapshot {
  projectsImportedToday: number;
  projectsPublishedToday: number;
  blogsGeneratedToday: number;
  leadsReceivedToday: number;
  buildersProcessedToday: number;
  failedJobsToday: number;
  pendingReviews: number;
  pendingContentApprovals: number;
}

export interface ActionRequiredItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: "critical" | "warning";
  actionLabel: string;
  href: string;
}

export type ProjectCompletionChecklist = Record<
  | "projectData"
  | "gallery"
  | "floorPlans"
  | "amenities"
  | "configurations"
  | "nearbyPlaces"
  | "seo"
  | "blogs"
  | "schema"
  | "leadForm"
  | "internalLinks",
  boolean
>;

export interface ProjectCompletionScore {
  projectId: string;
  slug: string;
  projectName: string;
  builderName: string;
  completionPercent: number;
  checklist: ProjectCompletionChecklist;
  missingItems: string[];
  href: string;
}

export interface BuilderPerformanceRow {
  rank: number;
  slug: string;
  name: string;
  logoUrl?: string;
  totalProjects: number;
  publishedProjects: number;
  successRate: number;
  lastImport: string | null;
  lastPublish: string | null;
  failedImports: number;
  averageProcessingTimeMs: number | null;
  reliabilityScore: number;
}

export interface LocalityCoverageRow {
  slug: string;
  name: string;
  projects: number;
  blogs: number;
  leads: number;
  nearbyPlaces: number;
  coverageScore: number;
}

export interface LocalityCoverageMetrics {
  byLocality: LocalityCoverageRow[];
  missingLocalities: Array<{ slug: string; name: string }>;
  underservedMarkets: LocalityCoverageRow[];
}

export interface DataQualityMetrics {
  score: number;
  level: ReadinessLevel;
  duplicateProjects: number;
  missingMandatoryFields: number;
  brokenImages: number;
  missingFloorPlans: number;
  missingCoordinates: number;
  missingSeo: number;
  missingMetaDescriptions: number;
  invalidUrls: number;
}

export interface ExecutiveTimelineItem extends ActivityTimelineItem {
  eventType: string;
}

export interface GlobalHealthReportRow {
  id: string;
  label: string;
  score: number;
  level: ReadinessLevel;
  summary: string;
}

export interface GlobalHealthReport {
  rows: GlobalHealthReportRow[];
  overall: number;
  overallLevel: ReadinessLevel;
}

export interface MissionControlExecutiveData {
  platformReadiness: PlatformReadinessScore;
  todaySnapshot: TodayBusinessSnapshot;
  actionRequired: ActionRequiredItem[];
  projectCompletion: ProjectCompletionScore[];
  builderPerformance: BuilderPerformanceRow[];
  localityCoverage: LocalityCoverageMetrics;
  dataQuality: DataQualityMetrics;
  executiveTimeline: ExecutiveTimelineItem[];
  smartNotifications: MissionControlAlert[];
  globalHealthReport: GlobalHealthReport;
}
