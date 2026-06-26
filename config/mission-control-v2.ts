import type { ServiceHealthStatus } from "@/types/mission-control";

export type ReadinessLevel = "healthy" | "attention" | "critical";

export const READINESS_THRESHOLDS = {
  healthy: 80,
  attention: 50,
} as const;

export const COMPLETION_CHECKLIST_KEYS = [
  "projectData",
  "gallery",
  "floorPlans",
  "amenities",
  "configurations",
  "nearbyPlaces",
  "seo",
  "blogs",
  "schema",
  "leadForm",
  "internalLinks",
] as const;

export const COMPLETION_CHECKLIST_LABELS: Record<
  (typeof COMPLETION_CHECKLIST_KEYS)[number],
  string
> = {
  projectData: "Project Data",
  gallery: "Gallery",
  floorPlans: "Floor Plans",
  amenities: "Amenities",
  configurations: "Configurations",
  nearbyPlaces: "Nearby Places",
  seo: "SEO",
  blogs: "Blogs",
  schema: "Schema",
  leadForm: "Lead Form",
  internalLinks: "Internal Links",
};

export const EXECUTIVE_TIMELINE_EVENT_TYPES = [
  { id: "all", label: "All Events" },
  { id: "import_started", label: "Import Started" },
  { id: "import_completed", label: "Import Completed" },
  { id: "review_approved", label: "Review Approved" },
  { id: "project_published", label: "Project Published" },
  { id: "landing_page_created", label: "Landing Page Created" },
  { id: "blog_generated", label: "Blog Generated" },
  { id: "sitemap_updated", label: "Sitemap Updated" },
  { id: "seo_generated", label: "SEO Generated" },
  { id: "lead_received", label: "Lead Received" },
  { id: "admin_login", label: "Admin Login" },
  { id: "error", label: "Errors" },
] as const;

export const PLATFORM_READINESS_DIMENSIONS = [
  "infrastructureHealth",
  "importEngine",
  "projectCompletion",
  "contentEngine",
  "seo",
  "locationIntelligence",
  "mediaAssets",
  "aiModules",
] as const;

export const READINESS_DIMENSION_LABELS: Record<
  (typeof PLATFORM_READINESS_DIMENSIONS)[number],
  string
> = {
  infrastructureHealth: "Infrastructure Health",
  importEngine: "Import Engine",
  projectCompletion: "Project Completion",
  contentEngine: "Content Engine",
  seo: "SEO",
  locationIntelligence: "Location Intelligence",
  mediaAssets: "Media Assets",
  aiModules: "AI Modules",
};

export function scoreToReadinessLevel(score: number): ReadinessLevel {
  if (score >= READINESS_THRESHOLDS.healthy) return "healthy";
  if (score >= READINESS_THRESHOLDS.attention) return "attention";
  return "critical";
}

export function healthStatusToScore(status: ServiceHealthStatus): number {
  if (status === "online") return 100;
  if (status === "warning") return 55;
  return 15;
}
