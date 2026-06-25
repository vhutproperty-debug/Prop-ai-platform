import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { Configuration } from "@/models/Configuration";
import { Amenity } from "@/models/Amenity";
import type { ContentSourceType } from "@/config/content-engine";
import type { ContentSourceContext } from "@/types/content-engine";

export interface ContentSourceProvider {
  type: ContentSourceType;
  load(sourceId: string): Promise<ContentSourceContext | null>;
}

async function loadProjectContext(projectId: string): Promise<ContentSourceContext | null> {
  return withDatabase(async () => {
    const project = await Project.findById(projectId)
      .select(
        "slug projectName builderId builderName location locationName microMarket status priceRange reraNumber possessionDate description tagline amenities configurations gallery"
      )
      .lean();
    if (!project) return null;

    const [builder, location, configs, amenityDocs] = await Promise.all([
      project.builderId
        ? Builder.findById(project.builderId).select("slug name website establishedYear description").lean()
        : null,
      project.location
        ? Location.findById(project.location).select("slug name city microMarket description").lean()
        : null,
      Configuration.find({ projectId: project._id, isActive: true })
        .select("name type bhk")
        .lean(),
      project.amenities?.length
        ? Amenity.find({ _id: { $in: project.amenities } }).select("name").lean()
        : [],
    ]);

    return {
      sourceType: "project",
      sourceId: String(project._id),
      project: {
        id: String(project._id),
        slug: project.slug,
        name: project.projectName,
        builderName: project.builderName,
        builderSlug: builder?.slug ?? project.builderName.toLowerCase().replace(/\s+/g, "-"),
        locationName: project.locationName,
        locationSlug: location?.slug,
        microMarket: project.microMarket,
        status: project.status,
        priceMin: project.priceRange?.min,
        priceMax: project.priceRange?.max,
        reraNumber: project.reraNumber,
        possessionDate: project.possessionDate
          ? new Date(project.possessionDate).toISOString().slice(0, 10)
          : undefined,
        amenities: amenityDocs.map((a) => a.name),
        configurations: configs.map((c) => ({
          name: c.name,
          type: c.type,
          bhk: c.bhk,
        })),
        description: project.description,
        tagline: project.tagline,
      },
      builder: builder
        ? {
            id: String(builder._id),
            slug: builder.slug,
            name: builder.name,
            website: builder.website,
            description: builder.description,
            establishedYear: builder.establishedYear,
          }
        : undefined,
      locality: location
        ? {
            id: String(location._id),
            slug: location.slug,
            name: location.name,
            city: location.city,
            microMarket: location.microMarket,
            description: location.description,
          }
        : undefined,
    };
  });
}

async function loadBuilderContext(builderId: string): Promise<ContentSourceContext | null> {
  return withDatabase(async () => {
    const builder = await Builder.findById(builderId).lean();
    if (!builder) return null;
    return {
      sourceType: "builder",
      sourceId: String(builder._id),
      builder: {
        id: String(builder._id),
        slug: builder.slug,
        name: builder.name,
        website: builder.website,
        description: builder.description,
        establishedYear: builder.establishedYear,
      },
    };
  });
}

async function loadLocalityContext(locationId: string): Promise<ContentSourceContext | null> {
  return withDatabase(async () => {
    const location = await Location.findById(locationId).lean();
    if (!location) return null;
    return {
      sourceType: "locality",
      sourceId: String(location._id),
      locality: {
        id: String(location._id),
        slug: location.slug,
        name: location.name,
        city: location.city,
        microMarket: location.microMarket,
        description: location.description,
      },
    };
  });
}

const providers: ContentSourceProvider[] = [
  { type: "project", load: loadProjectContext },
  { type: "builder", load: loadBuilderContext },
  { type: "locality", load: loadLocalityContext },
];

export const contentSourceRegistry = {
  async load(
    sourceType: ContentSourceType,
    sourceId: string
  ): Promise<ContentSourceContext | null> {
    const provider = providers.find((p) => p.type === sourceType);
    if (!provider) return null;
    return provider.load(sourceId);
  },

  async loadFromProject(projectId: string) {
    return loadProjectContext(projectId);
  },

  register(provider: ContentSourceProvider) {
    const idx = providers.findIndex((p) => p.type === provider.type);
    if (idx >= 0) providers[idx] = provider;
    else providers.push(provider);
  },
};
