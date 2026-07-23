import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { mimeTypeFromFilename } from "@/lib/project-intelligence/media-utils";
import { buildZipFromRemoteAssets } from "@/services/project-intelligence/media-download.service";

const downloadAssetsSchema = z.object({
  assets: z.array(
    z.object({
      url: z.string().url(),
      filename: z.string().optional(),
    })
  ),
  fallbackPrefix: z.enum(["image", "floorplan", "brochure"]).default("image"),
  zipName: z.string().optional(),
});

async function fetchSingleAsset(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropAI-ProjectIntelligence/1.0)",
        Accept: "image/*,application/pdf,*/*",
      },
      redirect: "follow",
    });
    if (!response.ok) return null;
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("admin");
    const body = await request.json();
    const input = downloadAssetsSchema.parse(body);

    if (!input.assets.length) {
      return apiError(new Error("No assets to download"));
    }

    if (input.assets.length === 1) {
      const asset = input.assets[0];
      const fetched = await fetchSingleAsset(asset.url);
      if (!fetched) return apiError(new Error("Asset download failed"));

      const filename =
        asset.filename ??
        (input.fallbackPrefix === "brochure" ? "brochure.pdf" : "download.bin");
      const contentType =
        fetched.contentType ?? mimeTypeFromFilename(filename) ?? "application/octet-stream";

      return new NextResponse(new Uint8Array(fetched.buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const { buffer, added, skipped } = await buildZipFromRemoteAssets(
      input.assets,
      input.fallbackPrefix
    );

    const zipName =
      input.zipName ??
      (input.fallbackPrefix === "floorplan"
        ? "floorplans.zip"
        : input.fallbackPrefix === "brochure"
          ? "brochures.zip"
          : "images.zip");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "X-Download-Added": String(added),
        "X-Download-Skipped": String(skipped),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
