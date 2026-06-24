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
import type { WebsiteFactsInput } from "@/validations/ingestion";

export function normalizeWebsiteFacts(
  raw: WebsiteFactsInput,
  source: ImportSource,
  logger: IngestionLogger
): NormalizedImportBundle {
  const slug = generateProjectSlug(raw.builderName, raw.projectName);
  logger.info("Normalized website facts", { slug });

  const configurations = raw.configurations.map((c) => ({
    slug: `${slug}-${c.type.toLowerCase().replace(/\s+/g, "-")}`,
    name: c.name,
    type: c.type,
    bhk: c.bhk,
    priceRange: c.priceRange,
    carpetArea:
      c.carpetAreaMin && c.carpetAreaMax
        ? { min: c.carpetAreaMin, max: c.carpetAreaMax, unit: "sqft" as const }
        : undefined,
  }));

  return {
    source,
    builder: {
      name: raw.builderName,
      slug: generateBuilderSlug(raw.builderName),
    },
    location: {
      name: raw.locationName,
      slug: generateLocationSlug(raw.locationName, raw.city),
      city: raw.city,
      microMarket: raw.microMarket,
      latitude: raw.latitude,
      longitude: raw.longitude,
    },
    project: stripMarketingFields(
      {
        builderName: raw.builderName,
        projectName: raw.projectName,
        slug,
        locationName: raw.locationName,
        microMarket: raw.microMarket,
        city: raw.city,
        configurations: ensureConfigurations(configurations, slug),
        priceRange: raw.priceRange,
        amenities: dedupeAmenities(raw.amenities),
        possessionDate: raw.possessionDate,
        reraNumber: raw.reraNumber,
        gallery: raw.gallery.map((g, i) => ({ ...g, order: i })),
        status: raw.status,
        latitude: raw.latitude,
        longitude: raw.longitude,
      },
      false
    ),
    metadata: {
      sourceReference: raw.sourceReference,
      extractedAt: new Date().toISOString(),
      copyrightSafe: true,
      fieldsExtracted: [
        "builderName",
        "projectName",
        "location",
        "configurations",
        "priceRange",
        "amenities",
        "possessionDate",
        "reraNumber",
        "gallery",
      ],
    },
  };
}
