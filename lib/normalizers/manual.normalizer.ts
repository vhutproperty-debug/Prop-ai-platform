import type { ImportSource } from "@/config/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import {
  dedupeAmenities,
  ensureConfigurations,
  generateBuilderSlug,
  generateLocationSlug,
  generateProjectSlug,
  stripMarketingFields,
} from "@/lib/normalizers/helpers";
import type { ManualImportInput } from "@/validations/ingestion";

export function normalizeManualImport(
  raw: ManualImportInput,
  source: ImportSource,
  logger: IngestionLogger
): NormalizedImportBundle {
  const { project, builder, location } = raw;
  const slug = project.slug ?? generateProjectSlug(project.builderName, project.projectName);

  logger.info("Normalized manual import", { slug });

  const configurations = project.configurations.map((c) => ({
    slug: `${slug}-${c.type.toLowerCase().replace(/\s+/g, "-")}`,
    name: c.name,
    type: c.type,
    bhk: c.bhk,
    priceRange: c.priceRange,
  }));

  return {
    source,
    builder: builder
      ? {
          name: builder.name,
          slug: builder.slug ?? generateBuilderSlug(builder.name),
          website: builder.website,
          establishedYear: builder.establishedYear,
          headquarters: builder.headquarters,
        }
      : {
          name: project.builderName,
          slug: generateBuilderSlug(project.builderName),
        },
    location: location
      ? {
          name: location.name,
          slug: location.slug ?? generateLocationSlug(location.name, location.city),
          city: location.city,
          microMarket: location.microMarket,
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : {
          name: project.locationName,
          slug: generateLocationSlug(project.locationName),
          city: "Mumbai",
          microMarket: project.microMarket,
        },
    project: stripMarketingFields(
      {
        builderName: project.builderName,
        projectName: project.projectName,
        slug,
        locationName: project.locationName,
        microMarket: project.microMarket,
        configurations: ensureConfigurations(configurations, slug),
        priceRange: project.priceRange,
        amenities: dedupeAmenities(project.amenities),
        possessionDate: project.possessionDate,
        reraNumber: project.reraNumber,
        gallery: project.gallery.map((g, i) => ({ ...g, order: i })),
        status: project.status,
        latitude: project.latitude,
        longitude: project.longitude,
        description: project.description,
        tagline: project.tagline,
        brochureUrl: project.brochureUrl,
      },
      true
    ),
    metadata: {
      extractedAt: new Date().toISOString(),
      copyrightSafe: true,
      fieldsExtracted: Object.keys(project),
    },
  };
}
