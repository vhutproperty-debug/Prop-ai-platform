import type { NormalizedImportBundle } from "@/types/ingestion";
import { withDatabase } from "@/lib/db/with-database";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { Project } from "@/models/Project";
import { Configuration } from "@/models/Configuration";
import { Amenity } from "@/models/Amenity";
import { Image } from "@/models/Image";
import { FAQ } from "@/models/FAQ";
import {
  generateBuilderSlug,
  normalizeAmenityName,
} from "@/lib/normalizers/helpers";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import type { ConfigurationType } from "@/config/model-constants";
import { mediaUploadService } from "@/services/publishing/media-upload.service";

export interface PublishOptions {
  existingProjectId?: string;
  isUpdate?: boolean;
  publishActive?: boolean;
}

export async function publishBundle(
  bundle: NormalizedImportBundle,
  logger: IngestionLogger,
  options: PublishOptions = {}
): Promise<string> {
  return withDatabase(async () => {
    const { project, builder, location, extensions } = bundle;
    const isUpdate = options.isUpdate ?? Boolean(options.existingProjectId);
    const publishActive = options.publishActive ?? true;

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

    const uploadedGallery = await mediaUploadService.uploadGallery(
      project.gallery,
      project.slug
    );

    const existingProject = options.existingProjectId
      ? await Project.findById(options.existingProjectId)
      : await Project.findOne({ slug: project.slug });

    const projectUpdate: Record<string, unknown> = {
      builderId,
      builderName: project.builderName,
      projectName: project.projectName,
      slug: project.slug,
      location: locationDoc._id,
      locationName: project.locationName,
      microMarket: project.microMarket,
      reraNumber: project.reraNumber,
      status: project.status ?? "ongoing",
      latitude: project.latitude,
      longitude: project.longitude,
      brochure: project.brochureUrl,
      seoTitle: project.projectName,
      isActive: publishActive,
    };

    if (isUpdate && existingProject) {
      projectUpdate.priceRange = project.priceRange;
      if (project.possessionDate) {
        projectUpdate.possessionDate = new Date(project.possessionDate);
      }
    } else {
      projectUpdate.priceRange = project.priceRange;
      projectUpdate.possessionDate = project.possessionDate
        ? new Date(project.possessionDate)
        : undefined;
      projectUpdate.featured = false;
      projectUpdate.seoDescription = project.tagline;
      projectUpdate.description = project.description;
      projectUpdate.tagline = project.tagline;
    }

    const projectDoc = await Project.findOneAndUpdate(
      existingProject ? { _id: existingProject._id } : { slug: project.slug },
      { $set: projectUpdate },
      { upsert: !existingProject, new: true }
    );

    const galleryIds: string[] = isUpdate
      ? (existingProject?.gallery as string[] | undefined)?.map(String) ?? []
      : [];

    for (const img of uploadedGallery) {
      const existingImage = await Image.findOne({
        publicId: img.publicId,
        entityId: projectDoc._id,
      });

      if (existingImage) {
        if (!galleryIds.includes(String(existingImage._id))) {
          galleryIds.push(String(existingImage._id));
        }
        continue;
      }

      const image = await Image.create({
        url: img.url,
        publicId: img.publicId,
        alt: img.alt ?? project.projectName,
        entityType: "project",
        entityId: projectDoc._id,
        type: img.type ?? "gallery",
        order: img.order ?? 0,
        width: img.width,
        height: img.height,
        isActive: true,
      });
      galleryIds.push(String(image._id));
    }

    const configIds: string[] = isUpdate
      ? (existingProject?.configurations as string[] | undefined)?.map(String) ?? []
      : [];

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
      if (!configIds.includes(String(configDoc._id))) {
        configIds.push(String(configDoc._id));
      }

      if (config.floorPlanImage) {
        const floorUpload = await mediaUploadService.uploadImageFromUrl(
          config.floorPlanImage,
          { projectSlug: project.slug, type: "floorplan" }
        );
        if (floorUpload) {
          const existingFloor = await Image.findOne({
            publicId: floorUpload.publicId,
            entityId: projectDoc._id,
            type: "floorplan",
          });
          if (!existingFloor) {
            await Image.create({
              url: floorUpload.url,
              publicId: floorUpload.publicId,
              alt: `${config.name} floor plan`,
              entityType: "project",
              entityId: projectDoc._id,
              type: "floorplan",
              order: config.bhk ?? 0,
              isActive: true,
            });
          }
        }
      }
    }

    if (extensions?.faqs?.length) {
      const existingFaqCount = await FAQ.countDocuments({
        entityType: "project",
        entityId: projectDoc._id,
      });

      if (!isUpdate || existingFaqCount === 0) {
        for (const [idx, faq] of extensions.faqs.entries()) {
          await FAQ.findOneAndUpdate(
            {
              entityType: "project",
              entityId: projectDoc._id,
              question: faq.question,
            },
            {
              $set: {
                answer: faq.answer,
                order: idx,
                isActive: true,
              },
            },
            { upsert: true }
          );
        }
      }
    }

    projectDoc.gallery = galleryIds as never;
    projectDoc.configurations = configIds as never;
    projectDoc.amenities = amenityIds as never;
    await projectDoc.save();

    if (!isUpdate) {
      await Builder.updateOne({ _id: builderId }, { $inc: { projectCount: 1 } });
    }

    logger.info(isUpdate ? "Project updated" : "Project published", {
      projectId: String(projectDoc._id),
    });
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

export const publishingService = {
  publishBundle,
};
