export const IMPORT_SOURCES = [
  "builder_website",
  "pdf_brochure",
  "manual",
  "csv",
] as const;
export type ImportSource = (typeof IMPORT_SOURCES)[number];

export const IMPORT_JOB_STATUSES = [
  "queued",
  "extracting",
  "normalizing",
  "validating",
  "pending_review",
  "approved",
  "rejected",
  "publishing",
  "published",
  "failed",
] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_RECORD_STATUSES = [
  "staged",
  "duplicate",
  "invalid",
  "approved",
  "rejected",
  "published",
] as const;
export type ImportRecordStatus = (typeof IMPORT_RECORD_STATUSES)[number];

export const IMPORT_ENTITY_TYPES = [
  "builder",
  "project",
  "location",
  "configuration",
] as const;
export type ImportEntityType = (typeof IMPORT_ENTITY_TYPES)[number];

export const DUPLICATE_MATCH_TYPES = [
  "exact_slug",
  "fuzzy_name",
  "rera_number",
  "builder_project_pair",
] as const;
export type DuplicateMatchType = (typeof DUPLICATE_MATCH_TYPES)[number];

/** Fields we are permitted to store — factual structured data only */
export const ALLOWED_PROJECT_FIELDS = [
  "builderName",
  "projectName",
  "slug",
  "locationName",
  "microMarket",
  "configurations",
  "priceRange",
  "amenities",
  "possessionDate",
  "reraNumber",
  "gallery",
  "status",
  "latitude",
  "longitude",
] as const;
