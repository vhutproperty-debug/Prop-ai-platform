export const AUTH_COOKIE = "propai_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const USER_ROLES = ["user", "agent", "builder", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_STATUSES = [
  "upcoming",
  "ongoing",
  "ready",
  "sold_out",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const LEAD_SOURCES = [
  "website",
  "ai-search",
  "project-page",
  "locality-page",
  "referral",
  "partner",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "SITE_VISIT",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const EMBEDDING_ENTITY_TYPES = ["project", "locality", "builder"] as const;
export type EmbeddingEntityType = (typeof EMBEDDING_ENTITY_TYPES)[number];

export const API_DEFAULT_LIMIT = 20;
export const API_MAX_LIMIT = 100;
