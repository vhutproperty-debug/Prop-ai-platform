import type { ImportSource } from "@/config/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import {
  dedupeAmenities,
  ensureConfigurations,
  generateBuilderSlug,
  generateLocationSlug,
  generateProjectSlug,
} from "@/lib/normalizers/helpers";
import type { CsvImportRow } from "@/validations/ingestion";

export function normalizeCsvGroup(
  rows: CsvImportRow[],
  source: ImportSource,
  logger: IngestionLogger
): NormalizedImportBundle {
  const first = rows[0];
  const slug = generateProjectSlug(first.builder_name, first.project_name);

  logger.info("Normalizing CSV project group", { slug, rowCount: rows.length });

  const configurations = rows.map((row) => ({
    slug: `${slug}-${row.configuration_type.toLowerCase().replace(/\s+/g, "-")}`,
    name: row.configuration_name,
    type: row.configuration_type,
    bhk: row.bhk,
    priceRange: {
      min: row.price_min,
      max: row.price_max,
      currency: "INR" as const,
    },
  }));

  const allAmenities = rows.flatMap((r) =>
    r.amenities ? r.amenities.split(/[;,|]/).map((a) => a.trim()) : []
  );

  const priceRange = {
    min: Math.min(...rows.map((r) => r.price_min)),
    max: Math.max(...rows.map((r) => r.price_max)),
    currency: "INR" as const,
  };

  return {
    source,
    builder: {
      name: first.builder_name,
      slug: generateBuilderSlug(first.builder_name),
    },
    location: {
      name: first.location_name,
      slug: generateLocationSlug(first.location_name),
      city: "Mumbai",
      microMarket: first.micro_market,
      latitude: first.latitude,
      longitude: first.longitude,
    },
    project: {
      builderName: first.builder_name,
      projectName: first.project_name,
      slug,
      locationName: first.location_name,
      microMarket: first.micro_market,
      configurations: ensureConfigurations(configurations, slug),
      priceRange,
      amenities: dedupeAmenities(allAmenities),
      possessionDate: first.possession_date,
      reraNumber: first.rera_number,
      gallery: first.gallery_url
        ? [{ url: first.gallery_url, type: "cover" as const, order: 0 }]
        : [],
      status: first.status,
      latitude: first.latitude,
      longitude: first.longitude,
    },
    metadata: {
      extractedAt: new Date().toISOString(),
      copyrightSafe: true,
      fieldsExtracted: Object.keys(first),
    },
  };
}
