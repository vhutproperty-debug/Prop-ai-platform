import type {
  ImportEntityType,
  ImportJobStatus,
  ImportRecordStatus,
  DuplicateMatchType,
  ImportSource,
} from "@/config/ingestion";

export type { ImportSource };
import type { PriceRange } from "@/types/models";
import type { ImportExtensions } from "@/types/firecrawl-import";

export interface IngestionLogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

export interface DuplicateMatch {
  type: DuplicateMatchType;
  entityType: ImportEntityType;
  existingId: string;
  existingSlug?: string;
  confidence: number;
  message: string;
}

export interface StagedConfiguration {
  slug: string;
  name: string;
  type: string;
  bhk?: number;
  priceRange: PriceRange;
  carpetArea?: { min: number; max: number; unit?: "sqft" | "sqm" };
  floorPlanImage?: string;
  floorPlanPdf?: string;
}

export interface StagedGalleryImage {
  url: string;
  alt?: string;
  type?: "cover" | "gallery" | "brochure" | "floorplan";
  order?: number;
}

/** Copyright-safe: structured facts only — no marketing prose from automated extraction */
export interface StagedProjectBundle {
  builderName: string;
  projectName: string;
  slug: string;
  locationName: string;
  microMarket?: string;
  city?: string;
  configurations: StagedConfiguration[];
  priceRange: PriceRange;
  amenities: string[];
  possessionDate?: string;
  reraNumber?: string;
  gallery: StagedGalleryImage[];
  status?: "upcoming" | "ongoing" | "ready" | "sold_out";
  latitude?: number;
  longitude?: number;
  /** Only allowed when source is manual — never auto-populated from scrapers */
  description?: string;
  tagline?: string;
  brochureUrl?: string;
}

export interface StagedBuilder {
  name: string;
  slug: string;
  website?: string;
  establishedYear?: number;
  headquarters?: string;
}

export interface StagedLocation {
  name: string;
  slug: string;
  city?: string;
  microMarket?: string;
  latitude?: number;
  longitude?: number;
}

export interface NormalizedImportBundle {
  source: ImportSource;
  builder?: StagedBuilder;
  location?: StagedLocation;
  project: StagedProjectBundle;
  metadata: {
    sourceReference?: string;
    extractedAt: string;
    copyrightSafe: true;
    fieldsExtracted: string[];
  };
  extensions?: ImportExtensions;
}

export interface ImportJobSummary {
  _id: string;
  source: ImportSource;
  status: ImportJobStatus;
  fileName?: string;
  recordCount: number;
  errorCount: number;
  duplicateCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportRecordSummary {
  _id: string;
  jobId: string;
  entityType: ImportEntityType;
  status: ImportRecordStatus;
  recordType?: import("@/config/ingestion").ImportRecordType;
  slug: string;
  displayName: string;
  duplicates: DuplicateMatch[];
  validationErrors: string[];
  stagedData: NormalizedImportBundle;
  publishedId?: string;
  existingProjectId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface ExtractionResult {
  raw: unknown;
  source: ImportSource;
  logs: IngestionLogEntry[];
}

export interface PipelineResult {
  jobId: string;
  status: ImportJobStatus;
  recordsCreated: number;
  duplicatesFound: number;
  validationFailures: number;
  logs: IngestionLogEntry[];
}
