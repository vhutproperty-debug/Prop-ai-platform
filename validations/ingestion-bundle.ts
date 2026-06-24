import { z } from "zod";
import { priceRangeSchema } from "@/validations/models";

const stagedConfigurationSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  type: z.string().min(2),
  bhk: z.number().int().optional(),
  priceRange: priceRangeSchema,
  carpetArea: z
    .object({
      min: z.number().positive(),
      max: z.number().positive(),
      unit: z.enum(["sqft", "sqm"]).optional(),
    })
    .optional(),
  floorPlanImage: z.string().url().optional(),
  floorPlanPdf: z.string().url().optional(),
});

export const stagedBundleSchema = z.object({
  source: z.enum(["builder_website", "firecrawl", "pdf_brochure", "manual", "csv"]),
  builder: z
    .object({
      name: z.string().min(2),
      slug: z.string().min(2),
      website: z.string().url().optional(),
      establishedYear: z.number().optional(),
      headquarters: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      name: z.string().min(2),
      slug: z.string().min(2),
      city: z.string().optional(),
      microMarket: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  project: z.object({
    builderName: z.string().min(2),
    projectName: z.string().min(2),
    slug: z.string().min(2),
    locationName: z.string().min(2),
    microMarket: z.string().optional(),
    city: z.string().optional(),
    configurations: z.array(stagedConfigurationSchema).min(1),
    priceRange: priceRangeSchema,
    amenities: z.array(z.string()),
    possessionDate: z.string().optional(),
    reraNumber: z.string().optional(),
    gallery: z.array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        type: z.enum(["cover", "gallery", "brochure", "floorplan"]).optional(),
        order: z.number().optional(),
      })
    ),
    status: z.enum(["upcoming", "ongoing", "ready", "sold_out"]).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    brochureUrl: z.string().url().optional(),
  }),
  metadata: z.object({
    sourceReference: z.string().optional(),
    extractedAt: z.string(),
    copyrightSafe: z.literal(true),
    fieldsExtracted: z.array(z.string()),
  }),
});

export type StagedBundle = z.infer<typeof stagedBundleSchema>;
