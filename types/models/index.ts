import type { Types } from "mongoose";
import type { AmenityCategory } from "@/config/model-constants";
import type { LeadSource, LeadStatus } from "@/config/constants";

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceRange {
  min: number;
  max: number;
  currency?: string;
}

export interface GeoCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface AreaRange {
  min: number;
  max: number;
  unit?: "sqft" | "sqm";
}

export interface IBuilder extends Timestamps {
  _id: Types.ObjectId | string;
  slug: string;
  name: string;
  logo?: Types.ObjectId | string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  projectCount: number;
  rating?: number;
  headquarters?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ILocation extends Timestamps, GeoCoordinates {
  _id: Types.ObjectId | string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  type: "locality" | "micro_market" | "suburb" | "district";
  microMarket?: string;
  parentLocation?: Types.ObjectId | string;
  avgPricePerSqft?: number;
  investmentScore?: number;
  rentalScore?: number;
  growthScore?: number;
  walkability?: number;
  connectivity?: number;
  aiRecommendation?: string;
  description?: string;
  coverImage?: Types.ObjectId | string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
}

export interface IConfiguration extends Timestamps {
  _id: Types.ObjectId | string;
  projectId: Types.ObjectId | string;
  slug: string;
  name: string;
  type: string;
  bhk?: number;
  carpetArea?: AreaRange;
  builtUpArea?: AreaRange;
  priceRange: PriceRange;
  availableUnits?: number;
  isActive: boolean;
}

export interface IAmenity extends Timestamps {
  _id: Types.ObjectId | string;
  slug: string;
  name: string;
  category: AmenityCategory;
  icon?: string;
  description?: string;
  isActive: boolean;
}

export interface IFAQ extends Timestamps {
  _id: Types.ObjectId | string;
  entityType: "project" | "builder" | "location";
  entityId: Types.ObjectId | string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface IImage extends Timestamps {
  _id: Types.ObjectId | string;
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
  entityType: "project" | "builder" | "location";
  entityId: Types.ObjectId | string;
  type: "cover" | "gallery" | "brochure" | "logo" | "floorplan";
  order: number;
  width?: number;
  height?: number;
  isActive: boolean;
}

export interface IProject extends Timestamps, GeoCoordinates {
  _id: Types.ObjectId | string;
  builderId: Types.ObjectId | string;
  builderName: string;
  projectName: string;
  slug: string;
  location: Types.ObjectId | string;
  locationName?: string;
  microMarket?: string;
  configurations: (Types.ObjectId | string)[];
  priceRange: PriceRange;
  amenities: (Types.ObjectId | string)[];
  gallery: (Types.ObjectId | string)[];
  reraNumber?: string;
  possessionDate?: Date;
  status: "upcoming" | "ongoing" | "ready" | "sold_out";
  description?: string;
  tagline?: string;
  brochure?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  faqs: (Types.ObjectId | string)[];
  isActive: boolean;
}

export interface ILead extends Timestamps {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  projectId?: Types.ObjectId | string;
  builderId?: Types.ObjectId | string;
  locationId?: Types.ObjectId | string;
  query?: string;
  budget?: PriceRange;
  status: LeadStatus;
  assignedTo?: Types.ObjectId | string;
  notes: string[];
  aiAnswers?: Record<string, string>;
}
