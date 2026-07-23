import type { ProjectIntelligenceReport } from "@/types/project-intelligence";
import {
  filenameFromUrl,
  mimeTypeFromFilename,
  sequentialImageFilename,
} from "@/lib/project-intelligence/media-utils";

/** Backfill structured media arrays for older saved reports. */
export function normalizeProjectIntelligenceReport(
  report: ProjectIntelligenceReport
): ProjectIntelligenceReport {
  if (report.images?.length || report.floorPlans?.length || report.brochures?.length) {
    return report;
  }

  const images = (report.media ?? [])
    .filter((item) => !["floor_plan", "master_plan", "brochure"].includes(item.type))
    .map((item, index) => ({
      url: item.url,
      filename:
        filenameFromUrl(item.url, sequentialImageFilename(index + 1, item.url)) ??
        sequentialImageFilename(index + 1, item.url),
      mimeType: mimeTypeFromFilename(item.url),
      source: item.sourceUrl,
      downloaded: false,
      type: item.type,
    }));

  const floorPlans = (report.media ?? [])
    .filter((item) => item.type === "floor_plan" || item.type === "master_plan")
    .map((item, index) => ({
      url: item.url,
      filename: filenameFromUrl(item.url, `floorplan-${index + 1}.jpg`),
      type: item.type,
      mimeType: mimeTypeFromFilename(item.url),
      source: item.sourceUrl,
    }));

  const brochures = (report.downloads ?? [])
    .filter((item) => item.type === "brochure")
    .map((item, index) => ({
      url: item.url,
      filename: filenameFromUrl(item.url, `brochure-${index + 1}.pdf`),
      mimeType: "application/pdf",
      source: item.url,
    }));

  return {
    ...report,
    images,
    floorPlans,
    brochures,
  };
}
