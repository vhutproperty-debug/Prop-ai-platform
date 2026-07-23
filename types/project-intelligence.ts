/** Standalone admin tool — Project Intelligence Extractor (schema v1). */

export const PROJECT_INTELLIGENCE_SCHEMA_VERSION = 1;

export interface ProjectIntelligenceMeta {
  schemaVersion: number;
  sourceUrl: string;
  canonicalUrl: string;
  extractedAt: string;
  durationMs: number;
  crawlStatus: "completed" | "partial" | "failed";
  pagesCrawled: number;
  pagesAttempted: string[];
  imageCount: number;
  floorPlanCount: number;
  extractionConfidence: number;
  firecrawlConfigured: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProjectIntelligenceProject {
  projectName?: string;
  builder?: string;
  address?: string;
  microLocation?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  reraNumber?: string;
  projectStatus?: string;
  launchDate?: string;
  expectedPossession?: string;
  revisedPossession?: string;
  currentPhase?: string;
  constructionStage?: string;
  towerCount?: number;
  floorCount?: number;
  unitCount?: number;
}

export interface ProjectIntelligenceUpdate {
  title: string;
  summary?: string;
  category?: string;
  sourceUrl?: string;
  extractedAt?: string;
}

export interface ProjectIntelligencePossession {
  expectedPossession?: string;
  revisedPossession?: string;
  towerWisePossession: Array<{ tower: string; possession?: string }>;
  phaseWisePossession: Array<{ phase: string; possession?: string }>;
  ocStatus?: string;
  ccStatus?: string;
  constructionCompletionPercent?: number;
  aiEstimatedMarketingStartDate?: string;
  aiConfidenceScore?: number;
}

export interface ProjectIntelligenceConfiguration {
  configuration: string;
  carpetArea?: string;
  balcony?: string;
  deck?: string;
  parking?: string;
  facing?: string;
  vastu?: string;
  priceRange?: string;
  sourceUrl?: string;
}

export interface ProjectIntelligenceSpecification {
  category: string;
  details: string[];
  sourceUrl?: string;
}

export interface ProjectIntelligenceLocationPoi {
  type: string;
  name: string;
  distance?: string;
  sourceUrl?: string;
}

export interface ProjectIntelligenceMediaItem {
  url: string;
  type:
    | "project"
    | "exterior"
    | "interior"
    | "amenity"
    | "master_plan"
    | "floor_plan"
    | "brochure"
    | "other";
  label?: string;
  sourceUrl?: string;
}

export interface ProjectIntelligenceDownloadLink {
  label: string;
  url: string;
  type: "brochure" | "price_list" | "floor_plan" | "master_plan" | "payment_plan" | "other";
}

export interface ProjectIntelligenceContact {
  builderWebsite?: string;
  salesOffice?: string;
  phone?: string;
  email?: string;
  sourceUrl?: string;
}

export interface ProjectIntelligenceAiSummary {
  projectOverview: string;
  keyHighlights: string[];
  possessionStatus: string;
  marketingReadiness: string;
  recommendedOwnerMarketingTimeline: string;
  importantMissingInformation: string[];
  confidenceScore: number;
}

export interface ProjectIntelligenceReport {
  meta: ProjectIntelligenceMeta;
  project: ProjectIntelligenceProject;
  projectUpdates: ProjectIntelligenceUpdate[];
  possession: ProjectIntelligencePossession;
  configurations: ProjectIntelligenceConfiguration[];
  specifications: ProjectIntelligenceSpecification[];
  amenities: string[];
  location: ProjectIntelligenceLocationPoi[];
  media: ProjectIntelligenceMediaItem[];
  downloads: ProjectIntelligenceDownloadLink[];
  videos: string[];
  virtualTours: string[];
  contact: ProjectIntelligenceContact;
  aiSummary: ProjectIntelligenceAiSummary;
  rawPageSummaries: Array<{
    url: string;
    title?: string;
    markdownLength: number;
  }>;
}

export interface SavedProjectIntelligence {
  id: string;
  sourceUrl: string;
  canonicalUrl: string;
  schemaVersion: number;
  report: ProjectIntelligenceReport;
  createdAt: string;
  updatedAt: string;
}
