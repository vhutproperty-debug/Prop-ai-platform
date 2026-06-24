import type { LeadSource, LeadStatus, UserRole } from "@/config/constants";
import type { EmbeddingEntityType } from "@/config/constants";

export type {
  Timestamps,
  PriceRange,
  GeoCoordinates,
  AreaRange,
  IBuilder,
  ILocation,
  IConfiguration,
  IAmenity,
  IFAQ,
  IImage,
  IProject,
  ILead,
} from "@/types/models";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmbedding {
  _id: string;
  entityType: EmbeddingEntityType;
  entityId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** @deprecated Use ILocation — retained for legacy Locality model */
export interface ILocality {
  _id: string;
  slug: string;
  name: string;
  city: string;
  image?: string;
  investmentScore?: number;
  rentalScore?: number;
  growthScore?: number;
  walkability?: number;
  connectivity?: number;
  aiRecommendation?: string;
  avgPricePerSqft?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type { LeadSource, LeadStatus };
