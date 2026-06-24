import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { Project } from "@/models/Project";
import { adminBuilderService } from "@/services/admin/builders.service";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { ProjectFilterInput } from "@/validations/admin";
import type { ProjectInput } from "@/validations/models";

export const adminProjectService = {
  async list(filters: ProjectFilterInput) {
    const { page, limit, search, status, builderId, isActive, featured } =
      filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, [
          "projectName",
          "builderName",
          "locationName",
          "slug",
          "microMarket",
        ]),
      };
      if (status) query.status = status;
      if (builderId) query.builderId = builderId;
      if (isActive !== undefined) query.isActive = isActive;
      if (featured !== undefined) query.featured = featured;

      const [items, total] = await Promise.all([
        Project.find(query)
          .select(
            "projectName builderName locationName status featured slug isActive updatedAt builderId location"
          )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Project.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const project = await Project.findById(id).lean();
      if (!project) throw new NotFoundError("Project");
      return project;
    });
  },

  async create(input: ProjectInput) {
    return withDatabase(async () => {
      const slug = input.slug || slugify(input.projectName);
      const [builder, location] = await Promise.all([
        Builder.findById(input.builderId).select("name").lean(),
        Location.findById(input.location).select("name microMarket").lean(),
      ]);

      if (!builder) throw new NotFoundError("Builder");
      if (!location) throw new NotFoundError("Location");

      const project = await Project.create({
        ...input,
        slug,
        builderName: builder.name,
        locationName: location.name,
        microMarket: input.microMarket ?? location.microMarket,
      });

      await adminBuilderService.syncBuilderProjectCount(String(input.builderId));
      return project;
    });
  },

  async update(id: string, input: Partial<ProjectInput>) {
    return withDatabase(async () => {
      const existing = await Project.findById(id);
      if (!existing) throw new NotFoundError("Project");

      if (input.builderId && input.builderId !== String(existing.builderId)) {
        const builder = await Builder.findById(input.builderId)
          .select("name")
          .lean();
        if (!builder) throw new NotFoundError("Builder");
        existing.builderId = input.builderId as never;
        existing.builderName = builder.name;
      }

      if (input.location && input.location !== String(existing.location)) {
        const location = await Location.findById(input.location)
          .select("name microMarket")
          .lean();
        if (!location) throw new NotFoundError("Location");
        existing.location = input.location as never;
        existing.locationName = location.name;
        if (!input.microMarket) existing.microMarket = location.microMarket;
      }

      Object.assign(existing, input);
      await existing.save();

      await adminBuilderService.syncBuilderProjectCount(
        String(existing.builderId)
      );

      return existing.toObject();
    });
  },

  async softDelete(id: string) {
    const project = await this.update(id, { isActive: false });
    return project;
  },

  async bulkAction(
    ids: string[],
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    return withDatabase(async () => {
      const update: Record<string, boolean> = {};
      if (action === "publish") update.isActive = true;
      if (action === "unpublish" || action === "delete") update.isActive = false;
      if (action === "feature") update.featured = true;
      if (action === "unfeature") update.featured = false;

      const result = await Project.updateMany(
        { _id: { $in: ids } },
        { $set: update }
      );

      const builders = await Project.find({ _id: { $in: ids } })
        .select("builderId")
        .lean();
      const builderIds = [...new Set(builders.map((p) => String(p.builderId)))];
      await Promise.all(
        builderIds.map((id) => adminBuilderService.syncBuilderProjectCount(id))
      );

      return { modified: result.modifiedCount };
    });
  },
};
