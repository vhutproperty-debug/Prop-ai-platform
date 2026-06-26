import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { NearbyPlace } from "@/models/NearbyPlace";
import { Project } from "@/models/Project";
import {
  buildPaginatedResult,
  buildTextSearchQuery,
  getPagination,
} from "@/services/admin/query";
import type { NearbyPlaceFilterInput } from "@/validations/location-intelligence";
import type { NearbyPlaceInput } from "@/types/location-intelligence";
import { buildNearbyPlaceSlug } from "@/services/location-intelligence/poi-utils";

export const adminNearbyPlaceService = {
  async list(filters: NearbyPlaceFilterInput) {
    const {
      page,
      limit,
      search,
      entityType,
      entityId,
      projectId,
      locationId,
      type,
      isActive,
    } = filters;
    const { skip } = getPagination(page, limit);

    return withDatabase(async () => {
      const query: Record<string, unknown> = {
        ...buildTextSearchQuery(search, ["name", "slug"]),
      };
      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (projectId) query.projectId = projectId;
      if (locationId) query.locationId = locationId;
      if (type) query.type = type;
      if (isActive !== undefined) query.isActive = isActive;

      const [items, total] = await Promise.all([
        NearbyPlace.find(query)
          .select(
            "name slug type entityType entityId projectId distanceLabel travelTimeLabel source confidence isActive updatedAt"
          )
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        NearbyPlace.countDocuments(query),
      ]);

      return buildPaginatedResult(items, total, page, limit);
    });
  },

  async getProjectOptions() {
    return withDatabase(() =>
      Project.find({ isActive: true })
        .select("projectName slug")
        .sort({ projectName: 1 })
        .limit(200)
        .lean()
    );
  },

  async create(input: NearbyPlaceInput) {
    return withDatabase(async () => {
      const slug = input.slug ?? buildNearbyPlaceSlug(input.name, input.type);
      let projectId: string | undefined;
      let locationId: string | undefined;

      if (input.entityType === "project") {
        const project = await Project.findById(input.entityId)
          .select("location")
          .lean();
        if (!project) throw new NotFoundError("Project");
        projectId = input.entityId;
        locationId = project.location ? String(project.location) : undefined;
      } else {
        locationId = input.entityId;
      }

      return NearbyPlace.findOneAndUpdate(
        { entityType: input.entityType, entityId: input.entityId, slug },
        {
          $set: {
            ...input,
            slug,
            projectId,
            locationId,
          },
        },
        { upsert: true, new: true, runValidators: true }
      ).lean();
    });
  },

  async update(id: string, input: Partial<NearbyPlaceInput>) {
    return withDatabase(async () => {
      const item = await NearbyPlace.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!item) throw new NotFoundError("NearbyPlace");
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

      const result = await NearbyPlace.updateMany(
        { _id: { $in: ids } },
        { $set: update }
      );
      return { modified: result.modifiedCount };
    });
  },
};
