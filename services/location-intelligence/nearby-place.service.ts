import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { NearbyPlace } from "@/models/NearbyPlace";
import { Project } from "@/models/Project";
import {
  POI_REQUIRED_CONTENT_TYPES,
  POI_TYPES,
  type PoiType,
} from "@/config/location-intelligence";
import type { ContentType } from "@/config/content-engine";
import type {
  NearbyPlaceInput,
  ProjectLocationIntelligence,
} from "@/types/location-intelligence";
import type { NearbyInfrastructure } from "@/types/content-research";
import {
  buildNearbyPlaceSlug,
  detectPoiDataGaps,
  mapFirecrawlPlace,
} from "@/services/location-intelligence/poi-utils";
import type { FirecrawlNearbyPlace } from "@/types/location-intelligence";

function serializePlace(doc: Record<string, unknown>) {
  return {
    _id: String(doc._id),
    entityType: doc.entityType as ProjectLocationIntelligence["places"][0]["entityType"],
    entityId: String(doc.entityId),
    projectId: doc.projectId ? String(doc.projectId) : undefined,
    locationId: doc.locationId ? String(doc.locationId) : undefined,
    type: doc.type as PoiType,
    name: String(doc.name),
    slug: String(doc.slug),
    distanceMeters: doc.distanceMeters as number | undefined,
    distanceLabel: doc.distanceLabel as string | undefined,
    travelTimeMinutes: doc.travelTimeMinutes as number | undefined,
    travelTimeLabel: doc.travelTimeLabel as string | undefined,
    latitude: doc.latitude as number | undefined,
    longitude: doc.longitude as number | undefined,
    source: doc.source as ProjectLocationIntelligence["places"][0]["source"],
    confidence: doc.confidence as ProjectLocationIntelligence["places"][0]["confidence"],
    isActive: Boolean(doc.isActive),
    createdAt: new Date(doc.createdAt as Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as Date).toISOString(),
  };
}

function toNearbyInfrastructure(
  place: ReturnType<typeof serializePlace>
): NearbyInfrastructure {
  return {
    type: place.type,
    name: place.name,
    distance: place.distanceLabel,
    travelTime: place.travelTimeLabel,
    confidence: place.confidence,
  };
}

export const nearbyPlaceService = {
  async listByProject(projectId: string, activeOnly = true) {
    return withDatabase(async () => {
      const query: Record<string, unknown> = { projectId };
      if (activeOnly) query.isActive = true;

      const docs = await NearbyPlace.find(query)
        .sort({ type: 1, name: 1 })
        .lean();

      return docs.map((doc) => serializePlace(doc as Record<string, unknown>));
    });
  },

  async getProjectIntelligence(projectId: string): Promise<ProjectLocationIntelligence> {
    const places = await this.listByProject(projectId);
    const byType = POI_TYPES.reduce(
      (acc, type) => {
        acc[type] = places.filter((p) => p.type === type);
        return acc;
      },
      {} as Record<PoiType, typeof places>
    );

    const project = await withDatabase(() =>
      Project.findById(projectId).select("location").lean()
    );

    return {
      projectId,
      locationId: project?.location ? String(project.location) : undefined,
      places,
      byType,
      dataGaps: [],
    };
  },

  async toResearchInfrastructure(projectId: string): Promise<NearbyInfrastructure[]> {
    const places = await this.listByProject(projectId);
    return places.map(toNearbyInfrastructure);
  },

  getRequiredPoiTypes(contentType: ContentType): PoiType[] {
    return POI_REQUIRED_CONTENT_TYPES[contentType] ?? [];
  },

  async validateForContentType(projectId: string, contentType: ContentType) {
    const required = this.getRequiredPoiTypes(contentType);
    if (!required.length) return { ok: true as const, gaps: [] as PoiType[] };

    const intelligence = await this.getProjectIntelligence(projectId);
    const existingTypes = [
      ...new Set(intelligence.places.map((p) => p.type)),
    ] as PoiType[];
    const gaps = detectPoiDataGaps(existingTypes, required);

    return {
      ok: gaps.length === 0,
      gaps,
      places: intelligence.places,
    };
  },

  async upsertForProject(
    projectId: string,
    input: Omit<NearbyPlaceInput, "entityType" | "entityId"> & {
      entityId?: string;
    }
  ) {
    return withDatabase(async () => {
      const project = await Project.findById(projectId).select("location").lean();
      if (!project) throw new NotFoundError("Project");

      const type = input.type;
      const slug = input.slug ?? buildNearbyPlaceSlug(input.name, type);

      const doc = await NearbyPlace.findOneAndUpdate(
        { entityType: "project", entityId: projectId, slug },
        {
          $set: {
            entityType: "project",
            entityId: projectId,
            projectId,
            locationId: project.location,
            type,
            name: input.name,
            slug,
            distanceMeters: input.distanceMeters,
            distanceLabel: input.distanceLabel,
            travelTimeMinutes: input.travelTimeMinutes,
            travelTimeLabel: input.travelTimeLabel,
            latitude: input.latitude,
            longitude: input.longitude,
            source: input.source ?? "manual",
            confidence: input.confidence ?? "medium",
            isActive: input.isActive ?? true,
          },
        },
        { upsert: true, new: true, runValidators: true }
      ).lean();

      return serializePlace(doc as Record<string, unknown>);
    });
  },

  async syncFromFirecrawl(
    projectId: string,
    places: FirecrawlNearbyPlace[],
    source: "firecrawl" | "import" = "firecrawl"
  ) {
    if (!places.length) return { synced: 0, skipped: 0 };

    let synced = 0;
    let skipped = 0;

    for (const raw of places) {
      if (!raw.name?.trim()) {
        skipped += 1;
        continue;
      }

      const mapped = mapFirecrawlPlace(raw);
      await this.upsertForProject(projectId, {
        ...mapped,
        source,
        confidence: "medium",
        isActive: true,
      });
      synced += 1;
    }

    return { synced, skipped };
  },

  async create(input: NearbyPlaceInput) {
    if (input.entityType === "project") {
      return this.upsertForProject(input.entityId, input);
    }

    return withDatabase(async () => {
      const slug = input.slug ?? buildNearbyPlaceSlug(input.name, input.type);
      const doc = await NearbyPlace.findOneAndUpdate(
        { entityType: input.entityType, entityId: input.entityId, slug },
        {
          $set: {
            ...input,
            slug,
            locationId: input.entityType === "location" ? input.entityId : undefined,
          },
        },
        { upsert: true, new: true, runValidators: true }
      ).lean();

      return serializePlace(doc as Record<string, unknown>);
    });
  },

  async update(id: string, input: Partial<NearbyPlaceInput>) {
    return withDatabase(async () => {
      const doc = await NearbyPlace.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();
      if (!doc) throw new NotFoundError("NearbyPlace");
      return serializePlace(doc as Record<string, unknown>);
    });
  },

  async softDelete(id: string) {
    return this.update(id, { isActive: false });
  },

  async getById(id: string) {
    return withDatabase(async () => {
      const doc = await NearbyPlace.findById(id).lean();
      if (!doc) throw new NotFoundError("NearbyPlace");
      return serializePlace(doc as Record<string, unknown>);
    });
  },
};
