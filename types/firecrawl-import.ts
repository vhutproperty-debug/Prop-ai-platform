import type { ImportRecordType } from "@/config/ingestion";
import type { PriceRange } from "@/types/models";

export interface ExtractedBuilderFacts {
  builderName: string;
  builderLogo?: string;
  builderDescription?: string;
  yearEstablished?: number;
  completedProjects?: number;
  ongoingProjects?: number;
  website: string;
}

export interface ExtractedConfiguration {
  configurationName: string;
  type: string;
  bhk?: number;
  carpetArea?: { min: number; max: number; unit: "sqft" | "sqm" };
  builtUpArea?: { min: number; max: number; unit: "sqft" | "sqm" };
  priceRange?: PriceRange;
  floorPlanImage?: string;
  floorPlanPdf?: string;
}

export interface ExtractedProjectFacts {
  projectName: string;
  slug: string;
  builderName: string;
  microMarket?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: "upcoming" | "ongoing" | "ready" | "sold_out";
  launchDate?: string;
  possessionDate?: string;
  constructionStage?: string;
  reraNumber?: string;
  minPrice?: number;
  maxPrice?: number;
  pricePerSqFt?: number;
  priceUpdatedAt?: string;
  configurations: ExtractedConfiguration[];
  coverImage?: string;
  galleryImages: string[];
  masterPlanImage?: string;
  locationMapImage?: string;
  constructionImages: string[];
  brochurePdf?: string;
  ebrochure?: string;
  amenities: Record<string, string[]>;
  nearbyPlaces?: Array<{
    type: string;
    name: string;
    distance?: string;
    travelTime?: string;
  }>;
  similarProjects: string[];
  competitorProjects: string[];
  faqs: Array<{ question: string; answer: string }>;
  sourceUrl: string;
}

export interface ImportExtensions {
  builder?: ExtractedBuilderFacts;
  floorPlans?: Array<{
    configurationName: string;
    imageUrl?: string;
    pdfUrl?: string;
    carpetArea?: number;
  }>;
  locationIntelligence?: ExtractedProjectFacts["nearbyPlaces"];
  similarProjects?: string[];
  competitorProjects?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  pricePerSqFt?: number;
  priceUpdatedAt?: string;
  constructionStage?: string;
  launchDate?: string;
}

export interface DeduplicationResult {
  recordType: ImportRecordType;
  matches: import("@/types/ingestion").DuplicateMatch[];
  existingProjectId?: string;
  shouldUpdate: boolean;
}

export interface ImportJobMetrics {
  totalBuilders: number;
  totalProjects: number;
  importJobs: number;
  projectsImported: number;
  projectsUpdated: number;
  duplicates: number;
  failures: number;
  pendingReviews: number;
}
