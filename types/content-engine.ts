import type { ContentSourceType } from "@/config/content-engine";
import type {
  ContentAuthorType,
  ContentStatus,
  ContentType,
} from "@/config/content-engine";

export interface ContentSection {
  id: string;
  heading: string;
  body: string;
  order: number;
}

export interface ContentFaq {
  question: string;
  answer: string;
  order: number;
}

export interface ContentTocItem {
  id: string;
  label: string;
  level: number;
}

export interface InternalLink {
  label: string;
  href: string;
  entityType: "project" | "builder" | "locality" | "article";
  entitySlug: string;
}

export interface ExternalReference {
  label: string;
  url: string;
}

export interface ImageSuggestion {
  type: "featured" | "gallery" | "section";
  url?: string;
  prompt: string;
  altText: string;
  caption?: string;
}

export interface SeoAnalysis {
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  seoScore: number;
  issues: string[];
  recommendations: string[];
}

export interface GeneratedArticlePayload {
  title: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  featuredSummary: string;
  tableOfContents: ContentTocItem[];
  introduction: string;
  sections: ContentSection[];
  faqs: ContentFaq[];
  callToAction: string;
  relatedProjects: string[];
  relatedBuilders: string[];
  relatedLocalities: string[];
  relatedArticles?: string[];
  imageSuggestions: ImageSuggestion[];
  imagePrompts: string[];
  schemaData: Record<string, unknown>;
  internalLinks: InternalLink[];
  externalReferences: ExternalReference[];
  socialCaption: string;
  newsletterSummary: string;
  keywords: string[];
  seoAnalysis: SeoAnalysis;
}

export interface ContentSourceContext {
  sourceType: ContentSourceType;
  sourceId: string;
  project?: {
    id: string;
    slug: string;
    name: string;
    builderName: string;
    builderSlug: string;
    locationName?: string;
    locationSlug?: string;
    microMarket?: string;
    status?: string;
    priceMin?: number;
    priceMax?: number;
    reraNumber?: string;
    possessionDate?: string;
    amenities?: string[];
    configurations?: Array<{ name: string; type: string; bhk?: number }>;
    description?: string;
    tagline?: string;
  };
  builder?: {
    id: string;
    slug: string;
    name: string;
    website?: string;
    description?: string;
    establishedYear?: number;
  };
  locality?: {
    id: string;
    slug: string;
    name: string;
    city?: string;
    microMarket?: string;
    description?: string;
  };
}

export interface ContentDashboardMetrics {
  totalArticles: number;
  drafts: number;
  scheduled: number;
  published: number;
  aiGenerated: number;
  humanEdited: number;
  lastPublished: string | null;
  projectCoverage: number;
  builderCoverage: number;
  localityCoverage: number;
  seoHealth: number;
  publishingQueue: number;
}

export interface GenerationRequest {
  projectId: string;
  contentTypes: ContentType[];
  quantityPerType?: number;
  campaignId?: string;
  createdBy?: string;
}

export interface ArticleSummary {
  _id: string;
  title: string;
  slug: string;
  contentType: ContentType;
  status: ContentStatus;
  authorType: ContentAuthorType;
  isAiGenerated: boolean;
  isHumanEdited: boolean;
  projectSlug?: string;
  builderSlug?: string;
  localitySlug?: string;
  seoScore?: number;
  scheduledAt?: string;
  publishedAt?: string;
  updatedAt: string;
}
