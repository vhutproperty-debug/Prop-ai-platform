import type {
  ContentType,
  FactConfidenceLevel,
  ExternalConnectorType,
  EditorialRecommendationType,
  OpportunityType,
} from "@/config/content-engine";
import type { ContentFaq } from "@/types/content-engine";

export interface ResearchSource {
  type: "internal" | "external";
  name: string;
  url?: string;
  fetchedAt: string;
  connectorId?: ExternalConnectorType;
}

export interface VerifiedFact {
  key: string;
  label: string;
  value: string;
  confidence: FactConfidenceLevel;
  source: ResearchSource;
  requiresReview: boolean;
}

export interface KeyNumber {
  metric: string;
  value: string;
  unit?: string;
  confidence: FactConfidenceLevel;
}

export interface NearbyInfrastructure {
  type: "school" | "hospital" | "metro" | "mall" | "airport" | "railway" | "other";
  name: string;
  distance?: string;
  travelTime?: string;
  confidence: FactConfidenceLevel;
}

export interface KnowledgePack {
  id?: string;
  projectId?: string;
  builderId?: string;
  localityId?: string;
  contentType: ContentType;
  researchedAt: string;
  verifiedFacts: VerifiedFact[];
  keyNumbers: KeyNumber[];
  amenities: string[];
  timeline: Array<{ event: string; date?: string; confidence: FactConfidenceLevel }>;
  pros: string[];
  cons: string[];
  nearbyInfrastructure: NearbyInfrastructure[];
  importantDistances: NearbyInfrastructure[];
  builderInformation: Record<string, string>;
  relatedProjects: Array<{ slug: string; name: string }>;
  competitors: Array<{ slug: string; name: string }>;
  seoKeywords: string[];
  faqs: ContentFaq[];
  sources: ResearchSource[];
  lowConfidenceCount: number;
  dataCompleteness: number;
  externalDataAvailable: boolean;
}

export interface ResearchPipelineResult {
  knowledgePack: KnowledgePack;
  validationErrors: string[];
  duplicateWarnings: DuplicateIntelligenceResult[];
  blocked: boolean;
  blockReason?: string;
}

export interface DuplicateIntelligenceResult {
  type: "near_duplicate" | "duplicate_topic" | "keyword_cannibalization" | "overlapping_faq";
  severity: "high" | "medium" | "low";
  existingArticleId?: string;
  existingSlug?: string;
  message: string;
  suggestion: "merge" | "update" | "skip" | "review";
}

export interface FreshnessAssessment {
  articleId: string;
  articleSlug: string;
  isOutdated: boolean;
  affectedSections: string[];
  refreshReason: string;
  suggestedAction: "regenerate_sections" | "full_regenerate" | "review_only";
  sourceChanges: string[];
}

export interface ContentOpportunity {
  type: OpportunityType;
  priority: number;
  title: string;
  description: string;
  suggestedContentType: ContentType;
  entityType: "project" | "builder" | "locality";
  entityId: string;
  entitySlug: string;
  entityName: string;
}

export interface EditorialRecommendation {
  type: EditorialRecommendationType;
  title: string;
  description: string;
  suggestedDate: string;
  priority: number;
  contentTypes: ContentType[];
  entityType?: "project" | "builder" | "locality";
  entitySlug?: string;
  campaignTheme?: string;
}

export interface ContentPerformanceSnapshot {
  articleId: string;
  articleSlug: string;
  organicTraffic: number;
  ctr: number;
  leadsGenerated: number;
  conversions: number;
  bounceRate: number;
  averageRanking: number;
  timeOnPage: number;
  contentDecayScore: number;
  periodStart: string;
  periodEnd: string;
  needsRefresh: boolean;
}

export interface IntelligenceDashboardData {
  opportunities: ContentOpportunity[];
  editorialCalendar: EditorialRecommendation[];
  freshnessAlerts: FreshnessAssessment[];
  performanceHighlights: ContentPerformanceSnapshot[];
  duplicateAlerts: DuplicateIntelligenceResult[];
  researchStats: {
    knowledgePacksTotal: number;
    lowConfidenceFacts: number;
    articlesNeedingRefresh: number;
  };
}

export interface InternalResearchData {
  project?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  locality?: Record<string, unknown>;
  configurations: Array<Record<string, unknown>>;
  amenities: string[];
  pricing: Record<string, unknown>;
  constructionStatus?: string;
  possession?: string;
  rera?: string;
  existingFaqs: ContentFaq[];
  relatedProjects: Array<{ slug: string; name: string }>;
  competitors: Array<{ slug: string; name: string }>;
  dataGaps: string[];
}

export interface ExternalResearchData {
  connectorId: ExternalConnectorType;
  available: boolean;
  items: Array<{ title: string; summary: string; url?: string; date?: string }>;
  fetchedAt: string;
}
