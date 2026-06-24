import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { Configuration } from "@/models/Configuration";
import { Project } from "@/models/Project";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { ConfigurationFilterInput } from "@/validations/admin";
import type { ConfigurationInput } from "@/validations/models";

export const adminConfigurationService = {
  async list(filters: ConfigurationFilterInput) {
    const { page, limit, search, projectId, isActive } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["name", "slug", "type"]),
      };
      if (projectId) query.projectId = projectId;
      if (isActive !== undefined) query.isActive = isActive;

      const [items, total] = await Promise.all([
        Configuration.find(query)
          .populate("projectId", "projectName slug")
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Configuration.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const item = await Configuration.findById(id).lean();
      if (!item) throw new NotFoundError("Configuration");
      return item;
    });
  },

  async create(input: ConfigurationInput) {
    return withDatabase(async () => {
      const config = await Configuration.create(input);
      await Project.findByIdAndUpdate(input.projectId, {
        $addToSet: { configurations: config._id },
      });
      return config;
    });
  },

  async update(id: string, input: Partial<ConfigurationInput>) {
    return withDatabase(async () => {
      const item = await Configuration.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!item) throw new NotFoundError("Configuration");
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

      const result = await Configuration.updateMany(
        { _id: { $in: ids } },
        { $set: update }
      );
      return { modified: result.modifiedCount };
    });
  },
};
