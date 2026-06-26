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
  "homepage",
  "project_page",
  "ai_assistant",
  "whatsapp",
  "manual",
  "referral",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "site_visit",
  "negotiation",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SCORES = ["hot", "warm", "cold"] as const;
export type LeadScore = (typeof LEAD_SCORES)[number];

/** @deprecated Legacy source values mapped at ingestion time */
export const LEGACY_LEAD_SOURCES = [
  "website",
  "ai-search",
  "project-page",
  "locality-page",
  "referral",
  "partner",
] as const;

export const EMBEDDING_ENTITY_TYPES = [
  "project",
  "locality",
  "builder",
  "article",
] as const;
export type EmbeddingEntityType = (typeof EMBEDDING_ENTITY_TYPES)[number];

export const API_DEFAULT_LIMIT = 20;
export const API_MAX_LIMIT = 100;
