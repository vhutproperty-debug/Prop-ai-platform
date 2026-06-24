import type { NormalizedImportBundle } from "@/types/ingestion";
import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { Project } from "@/models/Project";
import { Configuration } from "@/models/Configuration";
import { Amenity } from "@/models/Amenity";
import { Image } from "@/models/Image";
import { generateBuilderSlug, normalizeAmenityName } from "@/lib/normalizers/helpers";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import type { ConfigurationType } from "@/config/model-constants";

export async function publishBundle(
  bundle: NormalizedImportBundle,
  logger: IngestionLogger
): Promise<string> {
  return withDatabase(async () => {
    const { project, builder, location } = bundle;

    let builderId;
    if (builder) {
      const builderDoc = await Builder.findOneAndUpdate(
        { slug: builder.slug },
        {
          $set: {
            name: builder.name,
            slug: builder.slug,
            website: builder.website,
            establishedYear: builder.establishedYear,
            headquarters: builder.headquarters,
            isActive: true,
          },
          $setOnInsert: { projectCount: 0, rating: 0 },
        },
        { upsert: true, new: true }
      );
      builderId = builderDoc._id;
      logger.info("Builder upserted", { builderId: String(builderId) });
    } else {
      const slug = generateBuilderSlug(project.builderName);
      const builderDoc = await Builder.findOneAndUpdate(
        { slug },
        {
          $set: { name: project.builderName, slug, isActive: true },
          $setOnInsert: { projectCount: 0, rating: 0 },
        },
        { upsert: true, new: true }
      );
      builderId = builderDoc._id;
    }

    if (!location) {
      throw new Error("Location is required to publish a project");
    }

    const locationDoc = await Location.findOneAndUpdate(
      { slug: location.slug },
      {
        $set: {
          name: location.name,
          slug: location.slug,
          city: location.city ?? "Mumbai",
          microMarket: location.microMarket,
          latitude: location.latitude,
          longitude: location.longitude,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    const amenityIds: string[] = [];
    for (const amenityName of project.amenities) {
      const slug = amenityName.toLowerCase().replace(/\s+/g, "-");
      const amenity = await Amenity.findOneAndUpdate(
        { slug },
        {
          $set: {
            name: normalizeAmenityName(amenityName),
            slug,
            category: "lifestyle",
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      amenityIds.push(String(amenity._id));
    }

    const projectDoc = await Project.findOneAndUpdate(
      { slug: project.slug },
      {
        $set: {
          builderId,
          builderName: project.builderName,
          projectName: project.projectName,
          slug: project.slug,
          location: locationDoc._id,
          locationName: project.locationName,
          microMarket: project.microMarket,
          priceRange: project.priceRange,
          amenities: amenityIds,
          gallery: [],
          configurations: [],
          reraNumber: project.reraNumber,
          possessionDate: project.possessionDate
            ? new Date(project.possessionDate)
            : undefined,
          status: project.status ?? "ongoing",
          latitude: project.latitude,
          longitude: project.longitude,
          description: project.description,
          tagline: project.tagline,
          brochure: project.brochureUrl,
          featured: false,
          isActive: true,
          seoTitle: project.projectName,
          seoDescription: project.tagline,
        },
      },
      { upsert: true, new: true }
    );

    const galleryIds: string[] = [];
    for (const img of project.gallery) {
      const image = await Image.create({
        url: img.url,
        alt: img.alt ?? project.projectName,
        entityType: "project",
        entityId: projectDoc._id,
        type: img.type ?? "gallery",
        order: img.order ?? 0,
        isActive: true,
      });
      galleryIds.push(String(image._id));
    }

    const configIds: string[] = [];
    for (const config of project.configurations) {
      const configDoc = await Configuration.findOneAndUpdate(
        { projectId: projectDoc._id, slug: config.slug },
        {
          $set: {
            projectId: projectDoc._id,
            slug: config.slug,
            name: config.name,
            type: mapConfigurationType(config.type),
            bhk: config.bhk,
            priceRange: config.priceRange,
            carpetArea: config.carpetArea,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      configIds.push(String(configDoc._id));
    }

    projectDoc.gallery = galleryIds as never;
    projectDoc.configurations = configIds as never;
    await projectDoc.save();

    await Builder.updateOne({ _id: builderId }, { $inc: { projectCount: 1 } });

    logger.info("Project published", { projectId: String(projectDoc._id) });
    return String(projectDoc._id);
  });
}

function mapConfigurationType(type: string): ConfigurationType {
  const normalized = type.trim();
  const valid: ConfigurationType[] = [
    "1 BHK", "2 BHK", "3 BHK", "4 BHK", "4 BHK+", "5 BHK",
    "Villa", "Penthouse", "Studio", "Office", "Retail",
  ];
  const match = valid.find((v) => v.toLowerCase() === normalized.toLowerCase());
  return match ?? "2 BHK";
}
