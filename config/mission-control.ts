import type { PipelineStage } from "@/types/mission-control";

export const MISSION_CONTROL_PIPELINE_STAGES: PipelineStage[] = [
  { id: "firecrawl", label: "Firecrawl" },
  { id: "extraction", label: "Extraction" },
  { id: "normalization", label: "Normalization" },
  { id: "validation", label: "Validation" },
  { id: "review", label: "Review" },
  { id: "publish", label: "Publish" },
  { id: "landing_page", label: "Landing Page" },
  { id: "seo", label: "SEO" },
  { id: "blog_cluster", label: "Blog Cluster" },
  { id: "sitemap", label: "Sitemap" },
  { id: "search_index", label: "Search Index" },
  { id: "completed", label: "Completed" },
];

export const JOB_STATUS_TO_STAGE: Record<string, string> = {
  queued: "firecrawl",
  running: "firecrawl",
  extracting: "extraction",
  normalizing: "normalization",
  validating: "validation",
  pending_review: "review",
  approved: "review",
  rejected: "review",
  publishing: "publish",
  published: "landing_page",
  completed: "completed",
  failed: "validation",
};

export const CONTENT_FACTORY_LABELS: Record<string, string> = {
  investment_analysis: "Investment Guides",
  location_guide: "Location Guides",
  amenities_guide: "Amenities Guides",
  project_guide: "Floor Plan Guides",
  price_analysis: "Price Analysis",
  buying_guide: "Buyer's Guides",
  news: "News",
  evergreen: "Locality Guides",
};

export const POI_TYPE_LABELS: Record<string, string> = {
  school: "Schools",
  hospital: "Hospitals",
  metro: "Metro Stations",
  railway: "Railway Stations",
  mall: "Malls",
  other: "Other POI",
};

export const MISSION_CONTROL_REFRESH_MS = 30_000;
