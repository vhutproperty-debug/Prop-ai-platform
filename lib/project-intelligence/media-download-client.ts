"use client";

import { downloadBlob } from "@/lib/project-intelligence/export-client";
import { normalizeProjectIntelligenceReport } from "@/lib/project-intelligence/report-normalizer";
import type { ProjectIntelligenceReport } from "@/types/project-intelligence";

async function downloadZipFromAssets(input: {
  assets: Array<{ url: string; filename?: string }>;
  fallbackPrefix: "image" | "floorplan" | "brochure";
  zipName: string;
}) {
  const response = await fetch("/api/admin/project-intelligence/download-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? "Download failed");
  }

  const blob = await response.blob();
  downloadBlob(blob, input.zipName);
}

export async function downloadProjectImages(
  report: ProjectIntelligenceReport,
  filenameBase: string,
  selectedUrls?: string[]
) {
  const normalized = normalizeProjectIntelligenceReport(report);
  const pool = selectedUrls?.length
    ? normalized.images.filter((image) => selectedUrls.includes(image.url))
    : normalized.images;

  if (!pool.length) throw new Error("No images available");

  await downloadZipFromAssets({
    assets: pool.map((image) => ({ url: image.url, filename: image.filename })),
    fallbackPrefix: "image",
    zipName: `${filenameBase}-images.zip`,
  });
}

export async function downloadProjectFloorPlans(
  report: ProjectIntelligenceReport,
  filenameBase: string
) {
  const normalized = normalizeProjectIntelligenceReport(report);
  if (!normalized.floorPlans.length) throw new Error("No floor plans available");

  await downloadZipFromAssets({
    assets: normalized.floorPlans.map((plan) => ({
      url: plan.url,
      filename: plan.filename,
    })),
    fallbackPrefix: "floorplan",
    zipName: `${filenameBase}-floorplans.zip`,
  });
}

export async function downloadProjectBrochure(
  report: ProjectIntelligenceReport,
  filenameBase: string,
  savedId?: string | null
) {
  if (savedId) {
    const response = await fetch(
      `/api/admin/project-intelligence/${savedId}/download-brochure`
    );
    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(json?.error ?? "Brochure download failed");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    downloadBlob(blob, match?.[1] ?? `${filenameBase}-brochure.pdf`);
    return;
  }

  const normalized = normalizeProjectIntelligenceReport(report);
  if (!normalized.brochures.length) throw new Error("No brochure available");

  await downloadZipFromAssets({
    assets: normalized.brochures.map((brochure) => ({
      url: brochure.url,
      filename: brochure.filename,
    })),
    fallbackPrefix: "brochure",
    zipName:
      normalized.brochures.length === 1
        ? `${filenameBase}-brochure.pdf`
        : `${filenameBase}-brochures.zip`,
  });
}

export async function downloadSingleAsset(url: string, filename: string) {
  const response = await fetch("/api/admin/project-intelligence/download-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assets: [{ url, filename }],
      fallbackPrefix: "image",
      zipName: filename.endsWith(".zip") ? filename : `${filename}.zip`,
    }),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? "Download failed");
  }

  const blob = await response.blob();
  downloadBlob(blob, filename.includes(".") ? filename : `${filename}.jpg`);
}

export function getReportMediaCounts(report: ProjectIntelligenceReport) {
  const normalized = normalizeProjectIntelligenceReport(report);
  return {
    images: normalized.images.length,
    floorPlans: normalized.floorPlans.length,
    brochures: normalized.brochures.length,
  };
}
