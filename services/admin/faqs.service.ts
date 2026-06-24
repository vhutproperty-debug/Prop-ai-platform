import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { FAQ } from "@/models/FAQ";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { FaqFilterInput } from "@/validations/admin";
import type { FaqInput } from "@/validations/models";

export const adminFaqService = {
  async list(filters: FaqFilterInput) {
    const { page, limit, search, entityType, entityId, isActive } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["question", "answer"]),
      };
      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (isActive !== undefined) query.isActive = isActive;

      const [items, total] = await Promise.all([
        FAQ.find(query)
          .select("question entityType entityId order isActive updatedAt")
          .sort({ order: 1, updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FAQ.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const item = await FAQ.findById(id).lean();
      if (!item) throw new NotFoundError("FAQ");
      return item;
    });
  },

  async create(input: FaqInput) {
    return withDatabase(() => FAQ.create(input));
  },

  async update(id: string, input: Partial<FaqInput>) {
    return withDatabase(async () => {
      const item = await FAQ.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!item) throw new NotFoundError("FAQ");
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

      const result = await FAQ.updateMany({ _id: { $in: ids } }, { $set: update });
      return { modified: result.modifiedCount };
    });
  },
};
