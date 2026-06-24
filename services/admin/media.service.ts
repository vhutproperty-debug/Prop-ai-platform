import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { cloudinaryService } from "@/services/cloudinary.service";
import { Image } from "@/models/Image";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { MediaFilterInput } from "@/validations/admin";
import type { ImageInput } from "@/validations/models";

export const adminMediaService = {
  async list(filters: MediaFilterInput) {
    const { page, limit, search, entityType, type, isActive } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["alt", "caption", "publicId"]),
      };
      if (entityType) query.entityType = entityType;
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive;

      const [items, total] = await Promise.all([
        Image.find(query)
          .select(
            "url publicId alt caption entityType entityId type order width height isActive createdAt"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Image.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const item = await Image.findById(id).lean();
      if (!item) throw new NotFoundError("Image");
      return item;
    });
  },

  async create(input: ImageInput) {
    return withDatabase(() => Image.create(input));
  },

  async uploadAndCreate(
    file: File,
    meta: Pick<ImageInput, "entityType" | "entityId" | "type"> &
      Partial<Pick<ImageInput, "alt" | "caption" | "order" | "isActive">>
  ) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const upload = await cloudinaryService.uploadImage(
      base64,
      `propai/${meta.entityType}`
    );

    return this.create({
      ...meta,
      url: upload.url,
      publicId: upload.publicId,
      width: upload.width,
      height: upload.height,
      order: meta.order ?? 0,
      isActive: meta.isActive ?? true,
    });
  },

  async softDelete(id: string) {
    return withDatabase(async () => {
      const image = await Image.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).lean();
      if (!image) throw new NotFoundError("Image");
      return image;
    });
  },

  async hardDelete(id: string) {
    return withDatabase(async () => {
      const image = await Image.findById(id).lean();
      if (!image) throw new NotFoundError("Image");

      if (image.publicId && cloudinaryService.isConfigured) {
        await cloudinaryService.deleteImage(image.publicId);
      }

      await Image.findByIdAndDelete(id);
      return image;
    });
  },

  async bulkAction(
    ids: string[],
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    if (action === "delete") {
      const results = await Promise.all(ids.map((id) => this.hardDelete(id)));
      return { modified: results.length };
    }

    return withDatabase(async () => {
      const update: Record<string, boolean> = {};
      if (action === "publish") update.isActive = true;
      if (action === "unpublish") update.isActive = false;

      const result = await Image.updateMany(
        { _id: { $in: ids } },
        { $set: update }
      );
      return { modified: result.modifiedCount };
    });
  },
};
