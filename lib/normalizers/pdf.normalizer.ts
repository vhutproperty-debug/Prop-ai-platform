import type { ImportSource } from "@/config/ingestion";
import type { NormalizedImportBundle } from "@/types/ingestion";
import type { IngestionLogger } from "@/lib/ingestion/logger";
import type { PdfFactsExtracted } from "@/lib/parsers/pdf-text.parser";
import {
  dedupeAmenities,
  ensureConfigurations,
  generateBuilderSlug,
  generateLocationSlug,
  generateProjectSlug,
  mergePriceRanges,
  stripMarketingFields,
} from "@/lib/normalizers/helpers";

interface PdfRaw {
  text: string;
  fileName?: string;
  builderName?: string;
  projectName?: string;
  extractedFacts: PdfFactsExtracted;
}

export function normalizePdfFacts(
  raw: PdfRaw,
  source: ImportSource,
  logger: IngestionLogger
): NormalizedImportBundle {
  const facts = raw.extractedFacts;
  const builderName = facts.builderName ?? raw.builderName ?? "Unknown Builder";
  const projectName = facts.projectName ?? raw.projectName ?? "Unknown Project";

  if (!facts.builderName && !raw.builderName) {
    logger.warn("Builder name not found in PDF — using placeholder");
  }
  if (!facts.projectName && !raw.projectName) {
    logger.warn("Project name not found in PDF — using placeholder");
  }

  const slug = generateProjectSlug(builderName, projectName);
  const priceRange = mergePriceRanges(facts.priceRanges);

  const configurations = facts.configurations.map((c) => ({
    slug: `${slug}-${c.type.toLowerCase().replace(/\s+/g, "-")}`,
    name: c.type,
    type: c.type,
    bhk: c.bhk,
    priceRange: { ...priceRange, currency: "INR" },
  }));

  if (!configurations.length) {
    configurations.push({
      slug: `${slug}-default`,
      name: "Default",
      type: "2 BHK",
      bhk: 2,
      priceRange: { ...priceRange, currency: "INR" },
    });
    logger.warn("No configurations found in PDF — added default placeholder");
  }

  return {
    source,
    builder: { name: builderName, slug: generateBuilderSlug(builderName) },
    location: {
      name: "Mumbai",
      slug: generateLocationSlug("Mumbai"),
      city: "Mumbai",
    },
    project: stripMarketingFields(
      {
        builderName,
        projectName,
        slug,
        locationName: "Mumbai",
        configurations: ensureConfigurations(configurations, slug),
        priceRange: { ...priceRange, currency: "INR" },
        amenities: dedupeAmenities(facts.amenities),
        possessionDate: facts.possessionDate,
        reraNumber: facts.reraNumber,
        gallery: [],
        status: "upcoming",
      },
      false
    ),
    metadata: {
      sourceReference: raw.fileName,
      extractedAt: new Date().toISOString(),
      copyrightSafe: true,
      fieldsExtracted: [
        "reraNumber",
        "possessionDate",
        "configurations",
        "priceRange",
        "amenities",
      ],
    },
  };
}
