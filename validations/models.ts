import { z } from "zod";
import {
  AMENITY_CATEGORIES,
  CONFIGURATION_TYPES,
  FAQ_ENTITY_TYPES,
  IMAGE_ENTITY_TYPES,
  IMAGE_TYPES,
  LOCATION_TYPES,
} from "@/config/model-constants";
import { LEAD_SOURCES, LEAD_STATUSES, PROJECT_STATUSES } from "@/config/constants";
import { emailSchema, phoneSchema, slugSchema } from "@/validations/common";

export const priceRangeSchema = z
  .object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    currency: z.string().default("INR"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum price must be greater than or equal to minimum",
  });

export const areaRangeSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive(),
    unit: z.enum(["sqft", "sqm"]).default("sqft"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum area must be greater than or equal to minimum",
  });

export const geoSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const builderSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(120),
  logoUrl: z.string().url().optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional(),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  rating: z.number().min(0).max(5).optional(),
  headquarters: z.string().max(120).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const locationSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80).default("Mumbai"),
  state: z.string().min(2).max(80).default("Maharashtra"),
  country: z.string().min(2).max(80).default("India"),
  type: z.enum(LOCATION_TYPES).default("locality"),
  microMarket: z.string().max(120).optional(),
  parentLocation: z.string().optional(),
  avgPricePerSqft: z.number().nonnegative().optional(),
  investmentScore: z.number().min(0).max(100).optional(),
  rentalScore: z.number().min(0).max(100).optional(),
  growthScore: z.number().min(0).max(100).optional(),
  walkability: z.number().min(0).max(100).optional(),
  connectivity: z.number().min(0).max(100).optional(),
  aiRecommendation: z.string().max(1000).optional(),
  description: z.string().max(5000).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  isActive: z.boolean().default(true),
  ...geoSchema.shape,
});

export const configurationSchema = z.object({
  projectId: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(2).max(80),
  type: z.enum(CONFIGURATION_TYPES),
  bhk: z.number().int().min(0).max(10).optional(),
  carpetArea: areaRangeSchema.optional(),
  builtUpArea: areaRangeSchema.optional(),
  priceRange: priceRangeSchema,
  availableUnits: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const amenitySchema = z.object({
  slug: slugSchema,
  name: z.string().min(2).max(120),
  category: z.enum(AMENITY_CATEGORIES),
  icon: z.string().max(80).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const faqSchema = z.object({
  entityType: z.enum(FAQ_ENTITY_TYPES),
  entityId: z.string().min(1),
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(5000),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  alt: z.string().max(200).optional(),
  caption: z.string().max(300).optional(),
  entityType: z.enum(IMAGE_ENTITY_TYPES),
  entityId: z.string().min(1),
  type: z.enum(IMAGE_TYPES).default("gallery"),
  order: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const projectSchema = z.object({
  builderId: z.string().min(1),
  builderName: z.string().min(2).max(120),
  projectName: z.string().min(2).max(200),
  slug: slugSchema,
  location: z.string().min(1),
  locationName: z.string().max(120).optional(),
  microMarket: z.string().max(120).optional(),
  configurations: z.array(z.string()).default([]),
  priceRange: priceRangeSchema,
  amenities: z.array(z.string()).default([]),
  gallery: z.array(z.string()).default([]),
  reraNumber: z.string().max(80).optional(),
  possessionDate: z.coerce.date().optional(),
  status: z.enum(PROJECT_STATUSES).default("ongoing"),
  description: z.string().max(10000).optional(),
  tagline: z.string().max(300).optional(),
  brochure: z.string().url().optional(),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  faqs: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  ...geoSchema.shape,
});

export const leadModelSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  source: z.enum(LEAD_SOURCES).default("website"),
  projectId: z.string().optional(),
  builderId: z.string().optional(),
  locationId: z.string().optional(),
  query: z.string().max(1000).optional(),
  budget: priceRangeSchema.optional(),
  status: z.enum(LEAD_STATUSES).default("NEW"),
  notes: z.array(z.string()).default([]),
  aiAnswers: z.record(z.string(), z.string()).optional(),
});

export type BuilderInput = z.infer<typeof builderSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type ConfigurationInput = z.infer<typeof configurationSchema>;
export type AmenityInput = z.infer<typeof amenitySchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type LeadModelInput = z.infer<typeof leadModelSchema>;
