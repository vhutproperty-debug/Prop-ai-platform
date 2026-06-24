import type { ProjectStatus } from "@/config/constants";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Under Construction",
  ready: "Ready to Move",
  sold_out: "Sold Out",
};

export function formatPossessionLabel(
  possessionDate?: string,
  status?: ProjectStatus
): string | null {
  if (possessionDate) {
    const date = new Date(possessionDate);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }
  }

  if (status === "ready") return "Ready to move in";
  if (status === "sold_out") return "Sold out";
  if (status === "upcoming") return "Launching soon";
  return null;
}

export function formatAreaRange(
  range?: { min: number; max: number; unit?: string }
): string | null {
  if (!range) return null;
  const unit = range.unit ?? "sqft";
  if (range.min === range.max) {
    return `${range.min.toLocaleString("en-IN")} ${unit}`;
  }
  return `${range.min.toLocaleString("en-IN")} – ${range.max.toLocaleString("en-IN")} ${unit}`;
}
