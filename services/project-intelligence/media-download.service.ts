import JSZip from "jszip";
import {
  filenameFromUrl,
  mimeTypeFromFilename,
  sanitizeZipEntryName,
  sequentialFloorPlanFilename,
  sequentialImageFilename,
  uniqueFilename,
} from "@/lib/project-intelligence/media-utils";
import type {
  ProjectIntelligenceBrochureAsset,
  ProjectIntelligenceFloorPlanAsset,
  ProjectIntelligenceImageAsset,
} from "@/types/project-intelligence";

const FETCH_TIMEOUT_MS = 20_000;

export interface RemoteAssetInput {
  url: string;
  filename?: string;
}

async function fetchRemoteBuffer(
  url: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PropAI-ProjectIntelligence/1.0)",
        Accept: "image/*,application/pdf,*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function assignFilenames(
  assets: RemoteAssetInput[],
  fallbackPrefix: "image" | "floorplan" | "brochure"
): string[] {
  const used = new Set<string>();
  return assets.map((asset, index) => {
    const fallback =
      fallbackPrefix === "image"
        ? sequentialImageFilename(index + 1, asset.url)
        : fallbackPrefix === "floorplan"
          ? sequentialFloorPlanFilename(index + 1, asset.url)
          : filenameFromUrl(asset.url, `brochure-${index + 1}.pdf`);
    const raw = asset.filename ?? filenameFromUrl(asset.url, fallback) ?? fallback;
    return sanitizeZipEntryName(uniqueFilename(raw, used));
  });
}

export async function buildZipFromRemoteAssets(
  assets: RemoteAssetInput[],
  fallbackPrefix: "image" | "floorplan" | "brochure"
): Promise<{ buffer: Buffer; added: number; skipped: number }> {
  const zip = new JSZip();
  const filenames = assignFilenames(assets, fallbackPrefix);
  let added = 0;
  let skipped = 0;

  for (let i = 0; i < assets.length; i += 1) {
    const asset = assets[i];
    const filename = filenames[i];
    const fetched = await fetchRemoteBuffer(asset.url);
    if (!fetched) {
      skipped += 1;
      continue;
    }
    zip.file(filename, fetched.buffer);
    added += 1;
  }

  if (added === 0) {
    throw new Error("No assets could be downloaded");
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return { buffer, added, skipped };
}

export async function buildImagesZip(
  images: ProjectIntelligenceImageAsset[]
): Promise<Buffer> {
  const result = await buildZipFromRemoteAssets(
    images.map((image) => ({ url: image.url, filename: image.filename })),
    "image"
  );
  return result.buffer;
}

export async function buildFloorPlansZip(
  floorPlans: ProjectIntelligenceFloorPlanAsset[]
): Promise<Buffer> {
  const result = await buildZipFromRemoteAssets(
    floorPlans.map((plan) => ({ url: plan.url, filename: plan.filename })),
    "floorplan"
  );
  return result.buffer;
}

export async function buildBrochureDownload(
  brochures: ProjectIntelligenceBrochureAsset[]
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  if (!brochures.length) {
    throw new Error("No brochures available");
  }

  if (brochures.length === 1) {
    const brochure = brochures[0];
    const fetched = await fetchRemoteBuffer(brochure.url);
    if (!fetched) throw new Error("Brochure download failed");
    return {
      buffer: fetched.buffer,
      filename: sanitizeZipEntryName(brochure.filename || "brochure.pdf"),
      contentType: fetched.contentType ?? brochure.mimeType ?? "application/pdf",
    };
  }

  const zipBuffer = await buildZipFromRemoteAssets(
    brochures.map((brochure) => ({ url: brochure.url, filename: brochure.filename })),
    "brochure"
  ).then((result) => result.buffer);

  return {
    buffer: zipBuffer,
    filename: "brochures.zip",
    contentType: "application/zip",
  };
}

export function guessMimeType(filename: string): string {
  return mimeTypeFromFilename(filename);
}
