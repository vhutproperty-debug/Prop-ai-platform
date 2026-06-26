import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { Configuration } from "@/models/Configuration";
import { Amenity } from "@/models/Amenity";
import { FAQ } from "@/models/FAQ";
import type { ContentFaq } from "@/types/content-engine";
import type { InternalResearchData } from "@/types/content-research";
import { nearbyPlaceService } from "@/services/location-intelligence/nearby-place.service";
import { POI_TYPES, type PoiType } from "@/config/location-intelligence";

export class InsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientDataError";
  }
}

export const internalResearchService = {
  async collectFromProject(projectId: string): Promise<InternalResearchData> {
    return withDatabase(async () => {
      const project = await Project.findById(projectId).lean();
      if (!project) {
        throw new InsufficientDataError(`Project not found: ${projectId}`);
      }

      const [builder, location, configs, amenityDocs, faqDocs, relatedProjects] =
        await Promise.all([
          Builder.findById(project.builderId).lean(),
          Location.findById(project.location).lean(),
          Configuration.find({ projectId: project._id, isActive: true }).lean(),
          project.amenities?.length
            ? Amenity.find({ _id: { $in: project.amenities } }).select("name category").lean()
            : [],
          FAQ.find({ entityType: "project", entityId: project._id, isActive: true })
            .select("question answer order")
            .lean(),
          Project.find({
            microMarket: project.microMarket,
            isActive: true,
            _id: { $ne: project._id },
          })
            .select("slug projectName builderName priceRange status")
            .limit(8)
            .lean(),
        ]);

      const dataGaps: string[] = [];
      if (!project.reraNumber) dataGaps.push("rera");
      if (!project.possessionDate) dataGaps.push("possession");
      if (!configs.length) dataGaps.push("configurations");
      if (!amenityDocs.length) dataGaps.push("amenities");
      if (!project.description) dataGaps.push("description");
      if (!location?.connectivity) dataGaps.push("connectivity_scores");

      const nearbyPlaces = await nearbyPlaceService.toResearchInfrastructure(
        String(project._id)
      );
      const existingPoiTypes = [...new Set(nearbyPlaces.map((p) => p.type))] as PoiType[];
      for (const poiType of POI_TYPES) {
        if (!existingPoiTypes.includes(poiType)) {
          dataGaps.push(`nearby_${poiType}`);
        }
      }

      const existingFaqs: ContentFaq[] = faqDocs.map((f) => ({
        question: f.question,
        answer: f.answer,
        order: f.order ?? 0,
      }));

      if (!project.projectName || !project.builderName) {
        throw new InsufficientDataError(
          "Cannot research without project name and builder name"
        );
      }

      return {
        project: {
          id: String(project._id),
          slug: project.slug,
          name: project.projectName,
          status: project.status,
          microMarket: project.microMarket,
          locationName: project.locationName,
          latitude: project.latitude,
          longitude: project.longitude,
          tagline: project.tagline,
          description: project.description,
          updatedAt: project.updatedAt,
        },
        builder: builder
          ? {
              id: String(builder._id),
              slug: builder.slug,
              name: builder.name,
              website: builder.website,
              establishedYear: builder.establishedYear,
              description: builder.description,
            }
          : undefined,
        locality: location
          ? {
              id: String(location._id),
              slug: location.slug,
              name: location.name,
              city: location.city,
              microMarket: location.microMarket,
              connectivity: location.connectivity,
              investmentScore: location.investmentScore,
              rentalScore: location.rentalScore,
              avgPricePerSqft: location.avgPricePerSqft,
              description: location.description,
            }
          : undefined,
        configurations: configs.map((c) => ({
          name: c.name,
          type: c.type,
          bhk: c.bhk,
          priceMin: c.priceRange?.min,
          priceMax: c.priceRange?.max,
          carpetArea: c.carpetArea,
        })),
        amenities: amenityDocs.map((a) => a.name),
        pricing: {
          min: project.priceRange?.min,
          max: project.priceRange?.max,
          currency: project.priceRange?.currency ?? "INR",
          perSqftEstimate: location?.avgPricePerSqft,
        },
        constructionStatus: project.status,
        possession: project.possessionDate
          ? new Date(project.possessionDate).toISOString().slice(0, 10)
          : undefined,
        rera: project.reraNumber,
        existingFaqs,
        relatedProjects: relatedProjects.map((p) => ({
          slug: p.slug,
          name: p.projectName,
        })),
        competitors: relatedProjects
          .filter((p) => p.builderName !== project.builderName)
          .map((p) => ({ slug: p.slug, name: p.projectName })),
        dataGaps,
        nearbyPlaces,
        connectivityScore: location?.connectivity,
      };
    });
  },
};
