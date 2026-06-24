import type { BuilderCrawlConfig } from "@/config/builders";
import type {
  ExtractedBuilderFacts,
  ExtractedProjectFacts,
  ImportExtensions,
} from "@/types/firecrawl-import";
import type { NormalizedImportBundle } from "@/types/ingestion";
import {
  dedupeAmenities,
  ensureConfigurations,
  generateBuilderSlug,
  generateConfigurationSlug,
  generateLocationSlug,
  generateProjectSlug,
} from "@/lib/normalizers/helpers";
import type { AmenityCategory } from "@/config/model-constants";

const AMENITY_CATEGORY_MAP: Record<string, AmenityCategory> = {
  Sports: "sports",
  Kids: "lifestyle",
  Clubhouse: "lifestyle",
  Wellness: "wellness",
  Security: "security",
  Landscape: "green",
};

function flattenAmenities(
  categorized: Record<string, string[]>
): { names: string[]; categories: Record<string, AmenityCategory> } {
  const names: string[] = [];
  const categories: Record<string, AmenityCategory> = {};

  for (const [group, items] of Object.entries(categorized)) {
    const category = AMENITY_CATEGORY_MAP[group] ?? "lifestyle";
    for (const item of items) {
      names.push(item);
      categories[item.toLowerCase()] = category;
    }
  }

  return { names: dedupeAmenities(names), categories };
}

function defaultPriceRange(min?: number, max?: number) {
  const minPrice = min ?? 5_000_000;
  const maxPrice = max ?? minPrice * 1.5;
  return {
    min: Math.round(Math.min(minPrice, maxPrice)),
    max: Math.round(Math.max(minPrice, maxPrice)),
    currency: "INR" as const,
  };
}

export const normalizationService = {
  normalizeBuilder(builder: ExtractedBuilderFacts) {
    return {
      name: builder.builderName,
      slug: generateBuilderSlug(builder.builderName),
      website: builder.website,
      establishedYear: builder.yearEstablished,
      headquarters: undefined,
      logo: builder.builderLogo,
      description: builder.builderDescription,
      completedProjects: builder.completedProjects,
      ongoingProjects: builder.ongoingProjects,
    };
  },

  normalizeProject(
    facts: ExtractedProjectFacts,
    builder: BuilderCrawlConfig,
    sourceReference: string
  ): NormalizedImportBundle {
    const slug = facts.slug || generateProjectSlug(builder.name, facts.projectName);
    const locationName = facts.location ?? facts.microMarket ?? "Mumbai";
    const priceRange = defaultPriceRange(facts.minPrice, facts.maxPrice);

    const configurations = ensureConfigurations(
      facts.configurations.map((config) => ({
        slug: generateConfigurationSlug(slug, config.configurationName),
        name: config.configurationName,
        type: config.type,
        bhk: config.bhk,
        priceRange: config.priceRange ?? priceRange,
        carpetArea: config.carpetArea,
        floorPlanImage: config.floorPlanImage,
        floorPlanPdf: config.floorPlanPdf,
      })),
      slug
    );

    const { names: amenityNames } = flattenAmenities(facts.amenities);

    const gallery: NormalizedImportBundle["project"]["gallery"] = [];
    if (facts.coverImage) {
      gallery.push({ url: facts.coverImage, type: "cover", order: 0 });
    }
    facts.galleryImages.forEach((url, i) => {
      gallery.push({ url, type: "gallery", order: i + 1 });
    });
    if (facts.masterPlanImage) {
      gallery.push({ url: facts.masterPlanImage, type: "gallery", alt: "Master Plan" });
    }
    if (facts.locationMapImage) {
      gallery.push({ url: facts.locationMapImage, type: "gallery", alt: "Location Map" });
    }
    facts.constructionImages.forEach((url) => {
      gallery.push({ url, type: "gallery", alt: "Construction" });
    });

    const extensions: ImportExtensions = {
      builder: facts.builderName
        ? {
            builderName: facts.builderName,
            website: builder.website,
          }
        : undefined,
      floorPlans: facts.configurations.map((c) => ({
        configurationName: c.configurationName,
        imageUrl: c.floorPlanImage,
        pdfUrl: c.floorPlanPdf,
        carpetArea: c.carpetArea?.min,
      })),
      locationIntelligence: facts.nearbyPlaces,
      similarProjects: facts.similarProjects,
      competitorProjects: facts.competitorProjects,
      faqs: facts.faqs,
      pricePerSqFt: facts.pricePerSqFt,
      priceUpdatedAt: facts.priceUpdatedAt,
      constructionStage: facts.constructionStage,
      launchDate: facts.launchDate,
    };

    const fieldsExtracted = [
      "projectName",
      "slug",
      "location",
      "configurations",
      "priceRange",
      "amenities",
      "gallery",
      facts.reraNumber ? "reraNumber" : null,
      facts.possessionDate ? "possessionDate" : null,
      facts.faqs.length ? "faqs" : null,
      facts.nearbyPlaces?.length ? "locationIntelligence" : null,
    ].filter(Boolean) as string[];

    return {
      source: "firecrawl",
      builder: {
        name: builder.name,
        slug: builder.slug,
        website: builder.website,
      },
      location: {
        name: locationName,
        slug: generateLocationSlug(locationName),
        city: "Mumbai",
        microMarket: facts.microMarket,
        latitude: facts.latitude,
        longitude: facts.longitude,
      },
      project: {
        builderName: builder.name,
        projectName: facts.projectName,
        slug,
        locationName,
        microMarket: facts.microMarket,
        city: "Mumbai",
        configurations,
        priceRange,
        amenities: amenityNames,
        possessionDate: facts.possessionDate,
        reraNumber: facts.reraNumber,
        gallery,
        status: facts.status ?? "ongoing",
        latitude: facts.latitude,
        longitude: facts.longitude,
        brochureUrl: facts.brochurePdf ?? facts.ebrochure,
      },
      metadata: {
        sourceReference: sourceReference || facts.sourceUrl,
        extractedAt: new Date().toISOString(),
        copyrightSafe: true,
        fieldsExtracted,
      },
      extensions,
    };
  },
};
