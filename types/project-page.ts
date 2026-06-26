import type { ProjectStatus } from "@/config/constants";
import type { AmenityCategory } from "@/config/model-constants";
import type { AreaRange, PriceRange } from "@/types/models";

export interface ProjectPageImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  type: string;
  order: number;
}

export interface ProjectPageFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface ProjectPageAmenity {
  id: string;
  slug: string;
  name: string;
  category: AmenityCategory;
  icon?: string;
  description?: string;
}

export interface ProjectPageConfiguration {
  id: string;
  slug: string;
  name: string;
  type: string;
  bhk?: number;
  carpetArea?: AreaRange;
  builtUpArea?: AreaRange;
  priceRange: PriceRange;
  availableUnits?: number;
}

export interface ProjectPageBuilder {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  website?: string;
  establishedYear?: number;
  projectCount: number;
  rating?: number;
  headquarters?: string;
  logoUrl?: string;
}

export interface ProjectPageLocation {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  microMarket?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  investmentScore?: number;
  rentalScore?: number;
  growthScore?: number;
  walkability?: number;
  connectivity?: number;
}

export interface ProjectPageNearbyPlace {
  type: string;
  name: string;
  distanceLabel?: string;
  travelTimeLabel?: string;
}

export interface ProjectPageRelatedProject {
  slug: string;
  name: string;
  builderName?: string;
  priceMin?: number;
}

export interface ProjectPageRelatedArticle {
  slug: string;
  title: string;
  contentType: string;
}

export interface ProjectPageData {
  id: string;
  slug: string;
  projectName: string;
  builderName: string;
  tagline?: string;
  description?: string;
  status: ProjectStatus;
  priceRange: PriceRange;
  reraNumber?: string;
  possessionDate?: string;
  brochure?: string;
  latitude?: number;
  longitude?: number;
  microMarket?: string;
  locationName?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  builder: ProjectPageBuilder | null;
  location: ProjectPageLocation | null;
  configurations: ProjectPageConfiguration[];
  amenities: ProjectPageAmenity[];
  gallery: ProjectPageImage[];
  faqs: ProjectPageFaq[];
  nearbyPlaces: ProjectPageNearbyPlace[];
  floorPlans: ProjectPageImage[];
  relatedProjects: ProjectPageRelatedProject[];
  relatedArticles: ProjectPageRelatedArticle[];
}
