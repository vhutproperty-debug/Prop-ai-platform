import { z } from "zod";
import { IMPORT_SOURCES } from "@/config/ingestion";
import { priceRangeSchema } from "@/validations/models";
import { slugSchema } from "@/validations/common";

/** Structured facts submitted by builder — no scraped marketing copy */
export const websiteFactsSchema = z.object({
  builderName: z.string().min(2).max(120),
  projectName: z.string().min(2).max(200),
  locationName: z.string().min(2).max(120),
  microMarket: z.string().max(120).optional(),
  city: z.string().max(80).default("Mumbai"),
  configurations: z
    .array(
      z.object({
        name: z.string().min(2).max(80),
        type: z.string().min(2).max(40),
        bhk: z.number().int().min(0).max(10).optional(),
        priceRange: priceRangeSchema,
        carpetAreaMin: z.number().positive().optional(),
        carpetAreaMax: z.number().positive().optional(),
      })
    )
    .min(1),
  priceRange: priceRangeSchema,
  amenities: z.array(z.string().max(80)).default([]),
  possessionDate: z.string().optional(),
  reraNumber: z.string().max(80).optional(),
  gallery: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(200).optional(),
        type: z.enum(["cover", "gallery", "brochure", "floorplan"]).optional(),
      })
    )
    .default([]),
  status: z.enum(["upcoming", "ongoing", "ready", "sold_out"]).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  sourceReference: z.string().url().optional(),
});

export const pdfBrochureFactsSchema = z.object({
  /** Pre-extracted plain text from PDF — factual parsing only */
  text: z.string().min(20).max(50000),
  fileName: z.string().max(255).optional(),
  builderName: z.string().min(2).max(120).optional(),
  projectName: z.string().min(2).max(200).optional(),
});

export const manualImportSchema = z.object({
  builder: z
    .object({
      name: z.string().min(2).max(120),
      slug: slugSchema.optional(),
      website: z.string().url().optional(),
      establishedYear: z.number().int().optional(),
      headquarters: z.string().max(120).optional(),
    })
    .optional(),
  location: z
    .object({
      name: z.string().min(2).max(120),
      slug: slugSchema.optional(),
      city: z.string().default("Mumbai"),
      microMarket: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  project: z.object({
    builderName: z.string().min(2).max(120),
    projectName: z.string().min(2).max(200),
    slug: slugSchema.optional(),
    locationName: z.string().min(2).max(120),
    microMarket: z.string().optional(),
    configurations: z
      .array(
        z.object({
          name: z.string().min(2),
          type: z.string().min(2),
          bhk: z.number().int().optional(),
          priceRange: priceRangeSchema,
        })
      )
      .min(1),
    priceRange: priceRangeSchema,
    amenities: z.array(z.string()).default([]),
    possessionDate: z.string().optional(),
    reraNumber: z.string().optional(),
    gallery: z
      .array(z.object({ url: z.string().url(), alt: z.string().optional() }))
      .default([]),
    status: z.enum(["upcoming", "ongoing", "ready", "sold_out"]).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    description: z.string().max(10000).optional(),
    tagline: z.string().max(300).optional(),
    brochureUrl: z.string().url().optional(),
  }),
});

export const csvImportRowSchema = z.object({
  builder_name: z.string().min(2),
  project_name: z.string().min(2),
  location_name: z.string().min(2),
  micro_market: z.string().optional(),
  configuration_type: z.string().min(2),
  configuration_name: z.string().min(2),
  price_min: z.coerce.number().nonnegative(),
  price_max: z.coerce.number().nonnegative(),
  bhk: z.coerce.number().int().optional(),
  amenities: z.string().optional(),
  possession_date: z.string().optional(),
  rera_number: z.string().optional(),
  gallery_url: z.string().url().optional(),
  status: z.enum(["upcoming", "ongoing", "ready", "sold_out"]).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const ingestionRequestSchema = z.object({
  source: z.enum(IMPORT_SOURCES),
  payload: z.unknown(),
  fileName: z.string().optional(),
  sourceReference: z.string().optional(),
});

export type WebsiteFactsInput = z.infer<typeof websiteFactsSchema>;
export type PdfBrochureFactsInput = z.infer<typeof pdfBrochureFactsSchema>;
export type ManualImportInput = z.infer<typeof manualImportSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
export type IngestionRequest = z.infer<typeof ingestionRequestSchema>;
