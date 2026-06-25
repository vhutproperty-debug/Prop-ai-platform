export const CONTENT_TYPES = [
  "project_guide",
  "project_review",
  "price_analysis",
  "investment_analysis",
  "location_guide",
  "builder_profile",
  "nearby_schools",
  "nearby_hospitals",
  "connectivity_guide",
  "rental_analysis",
  "amenities_guide",
  "construction_updates",
  "market_trends",
  "buying_guide",
  "selling_guide",
  "interior_ideas",
  "faq_article",
  "comparison",
  "news",
  "evergreen",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_SOURCE_TYPES = [
  "project",
  "builder",
  "locality",
  "market_stats",
  "amenities",
  "infrastructure",
  "ai_insight",
] as const;
export type ContentSourceType = (typeof CONTENT_SOURCE_TYPES)[number];

export const CONTENT_AUTHOR_TYPES = ["ai", "human", "hybrid"] as const;
export type ContentAuthorType = (typeof CONTENT_AUTHOR_TYPES)[number];

export const CONTENT_JOB_TYPES = [
  "generate",
  "validate",
  "schedule",
  "publish",
  "refresh",
  "bulk_generate",
  "research",
] as const;
export type ContentJobType = (typeof CONTENT_JOB_TYPES)[number];

export const CONTENT_JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const;
export type ContentJobStatus = (typeof CONTENT_JOB_STATUSES)[number];

export const CONTENT_CAMPAIGN_TYPES = [
  "builder",
  "project",
  "locality",
  "festival",
  "investment",
  "market_report",
  "newsletter",
  "social",
  "launch",
] as const;
export type ContentCampaignType = (typeof CONTENT_CAMPAIGN_TYPES)[number];

export const CONTENT_AUDIT_ACTIONS = [
  "created",
  "generated",
  "edited",
  "validated",
  "approved",
  "rejected",
  "scheduled",
  "published",
  "archived",
  "republished",
  "refreshed",
  "version_created",
] as const;
export type ContentAuditAction = (typeof CONTENT_AUDIT_ACTIONS)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  project_guide: "Project Guide",
  project_review: "Project Review",
  price_analysis: "Price Analysis",
  investment_analysis: "Investment Analysis",
  location_guide: "Location Guide",
  builder_profile: "Builder Profile",
  nearby_schools: "Nearby Schools",
  nearby_hospitals: "Nearby Hospitals",
  connectivity_guide: "Connectivity Guide",
  rental_analysis: "Rental Analysis",
  amenities_guide: "Amenities Guide",
  construction_updates: "Construction Updates",
  market_trends: "Market Trends",
  buying_guide: "Buying Guide",
  selling_guide: "Selling Guide",
  interior_ideas: "Interior Ideas",
  faq_article: "FAQ Article",
  comparison: "Comparison",
  news: "News",
  evergreen: "Evergreen",
};

export const DEFAULT_GENERATION_CONTENT_TYPES: ContentType[] = [
  "project_guide",
  "price_analysis",
  "location_guide",
  "amenities_guide",
  "faq_article",
];

export const FACT_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type FactConfidenceLevel = (typeof FACT_CONFIDENCE_LEVELS)[number];

export const EXTERNAL_CONNECTOR_TYPES = [
  "government_data",
  "infrastructure_updates",
  "builder_announcements",
  "market_statistics",
  "interest_rate_trends",
  "news_feeds",
] as const;
export type ExternalConnectorType = (typeof EXTERNAL_CONNECTOR_TYPES)[number];

export const EDITORIAL_RECOMMENDATION_TYPES = [
  "daily_topic",
  "weekly_topic",
  "monthly_report",
  "seasonal_campaign",
  "festival_campaign",
  "builder_launch",
  "infrastructure_update",
  "investment_opportunity",
] as const;
export type EditorialRecommendationType =
  (typeof EDITORIAL_RECOMMENDATION_TYPES)[number];

export const OPPORTUNITY_TYPES = [
  "missing_locality_guide",
  "missing_builder_profile",
  "missing_comparison",
  "missing_investment_guide",
  "missing_faq_coverage",
  "missing_project_guide",
  "missing_price_analysis",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const AI_PROVIDER_IDS = ["openai", "template"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];
