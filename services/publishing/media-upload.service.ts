import { createHash } from "crypto";
import { cloudinaryService } from "@/services/cloudinary.service";
import { withDatabase } from "@/lib/db/with-database";
import { Image } from "@/models/Image";
import type { ImageType } from "@/config/model-constants";

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

function buildPublicId(folder: string, url: string, projectSlug: string): string {
  const hash = hashUrl(url);
  return `${folder}/${projectSlug}/${hash}`;
}

export const mediaUploadService = {
  async uploadImageFromUrl(
    url: string,
    options: {
      folder?: string;
      projectSlug: string;
      type?: ImageType;
    }
  ): Promise<{ url: string; publicId: string; width?: number; height?: number } | null> {
    const folder = options.folder ?? "propai/projects";
    const publicId = buildPublicId(folder, url, options.projectSlug);

    const existing = await withDatabase(() =>
      Image.findOne({ publicId }).select("url publicId width height").lean()
    );

    if (existing) {
      return {
        url: existing.url,
        publicId: existing.publicId!,
        width: existing.width,
        height: existing.height,
      };
    }

    if (!cloudinaryService.isConfigured) {
      return { url, publicId, width: undefined, height: undefined };
    }

    try {
      const result = await cloudinaryService.uploadImage(url, folder, publicId);
      return result;
    } catch {
      return { url, publicId, width: undefined, height: undefined };
    }
  },

  async uploadGallery(
    images: Array<{ url: string; type?: ImageType; alt?: string; order?: number }>,
    projectSlug: string
  ) {
    const batchSize = 5;
    const results: Array<{
      url: string;
      publicId: string;
      type?: ImageType;
      alt?: string;
      order?: number;
      width?: number;
      height?: number;
    }> = [];

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const uploaded = await Promise.all(
        batch.map(async (img) => {
          const result = await this.uploadImageFromUrl(img.url, {
            projectSlug,
            type: img.type,
          });
          if (!result) return null;
          return { ...img, ...result };
        })
      );
      results.push(...uploaded.filter(Boolean) as typeof results);
    }

    return results;
  },
};
