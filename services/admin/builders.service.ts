import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { Builder } from "@/models/Builder";
import { Project } from "@/models/Project";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { BuilderFilterInput } from "@/validations/admin";
import type { BuilderInput } from "@/validations/models";

async function syncBuilderProjectCount(builderId: string) {
  const count = await Project.countDocuments({ builderId, isActive: true });
  await Builder.findByIdAndUpdate(builderId, { projectCount: count });
}

export const adminBuilderService = {
  async list(filters: BuilderFilterInput) {
    const { page, limit, search, isActive, isFeatured } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["name", "slug", "headquarters"]),
      };
      if (isActive !== undefined) query.isActive = isActive;
      if (isFeatured !== undefined) query.isFeatured = isFeatured;

      const [items, total] = await Promise.all([
        Builder.find(query)
          .select(
            "name slug logoUrl website projectCount isActive isFeatured rating updatedAt"
          )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Builder.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const builder = await Builder.findById(id).lean();
      if (!builder) throw new NotFoundError("Builder");
      return builder;
    });
  },

  async create(input: BuilderInput) {
    return withDatabase(async () => {
      const slug = input.slug || slugify(input.name);
      return Builder.create({ ...input, slug });
    });
  },

  async update(id: string, input: Partial<BuilderInput>) {
    return withDatabase(async () => {
      const builder = await Builder.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!builder) throw new NotFoundError("Builder");
      return builder;
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
      if (action === "feature") update.isFeatured = true;
      if (action === "unfeature") update.isFeatured = false;

      const result = await Builder.updateMany({ _id: { $in: ids } }, { $set: update });
      return { modified: result.modifiedCount };
    });
  },

  async getOptions() {
    return withDatabase(() =>
      Builder.find({ isActive: true })
        .select("name slug")
        .sort({ name: 1 })
        .lean()
    );
  },

  syncBuilderProjectCount,
};
