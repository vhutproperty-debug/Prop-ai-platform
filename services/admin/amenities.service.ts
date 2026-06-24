import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { Amenity } from "@/models/Amenity";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { AmenityFilterInput } from "@/validations/admin";
import type { AmenityInput } from "@/validations/models";

export const adminAmenityService = {
  async list(filters: AmenityFilterInput) {
    const { page, limit, search, category, isActive } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["name", "slug", "description"]),
      };
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive;

      const [items, total] = await Promise.all([
        Amenity.find(query)
          .select("name slug category icon isActive updatedAt")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Amenity.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const item = await Amenity.findById(id).lean();
      if (!item) throw new NotFoundError("Amenity");
      return item;
    });
  },

  async create(input: AmenityInput) {
    return withDatabase(async () => {
      const slug = input.slug || slugify(input.name);
      return Amenity.create({ ...input, slug });
    });
  },

  async update(id: string, input: Partial<AmenityInput>) {
    return withDatabase(async () => {
      const item = await Amenity.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!item) throw new NotFoundError("Amenity");
      return item;
    });
  },

  async softDelete(id: string) {
    return this.update(id, { isActive: false });
  },

  async bulkAction(
    ids: string[],
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    return withDatabase(async () => {
      const update: Record<string, boolean> = {};
      if (action === "publish") update.isActive = true;
      if (action === "unpublish" || action === "delete") update.isActive = false;

      const result = await Amenity.updateMany(
        { _id: { $in: ids } },
        { $set: update }
      );
      return { modified: result.modifiedCount };
    });
  },

  async getOptions() {
    return withDatabase(() =>
      Amenity.find({ isActive: true })
        .select("name slug category")
        .sort({ name: 1 })
        .lean()
    );
  },
};
