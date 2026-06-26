import { z } from "zod";
import {
  POI_CONFIDENCE_LEVELS,
  POI_ENTITY_TYPES,
  POI_SOURCES,
  POI_TYPES,
} from "@/config/location-intelligence";
import { paginationSchema } from "@/validations/common";

export const nearbyPlaceSchema = z.object({
  entityType: z.enum(POI_ENTITY_TYPES),
  entityId: z.string().min(1),
  type: z.enum(POI_TYPES),
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  distanceMeters: z.number().min(0).optional(),
  distanceLabel: z.string().max(80).optional(),
  travelTimeMinutes: z.number().min(0).optional(),
  travelTimeLabel: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  source: z.enum(POI_SOURCES).default("manual"),
  confidence: z.enum(POI_CONFIDENCE_LEVELS).default("medium"),
  isActive: z.boolean().default(true),
});

export const createNearbyPlaceSchema = nearbyPlaceSchema;
export const updateNearbyPlaceSchema = nearbyPlaceSchema.partial().extend({
  id: z.string().min(1),
});

export const nearbyPlaceFilterSchema = z
  .object({
    search: z.string().max(120).optional(),
    entityType: z.enum(POI_ENTITY_TYPES).optional(),
    entityId: z.string().optional(),
    projectId: z.string().optional(),
    locationId: z.string().optional(),
    type: z.enum(POI_TYPES).optional(),
    isActive: z
      .enum(["true", "false", "all"])
      .optional()
      .transform((v) => (v === "all" || !v ? undefined : v === "true")),
    ...paginationSchema.shape,
  })
  .strict();

export const bulkSyncNearbyPlacesSchema = z.object({
  projectId: z.string().min(1),
  places: z.array(
    z.object({
      type: z.string().min(1),
      name: z.string().min(2).max(200),
      distance: z.string().max(80).optional(),
      travelTime: z.string().max(80).optional(),
    })
  ),
  source: z.enum(POI_SOURCES).default("firecrawl"),
});

export type NearbyPlaceInput = z.infer<typeof nearbyPlaceSchema>;
export type NearbyPlaceFilterInput = z.infer<typeof nearbyPlaceFilterSchema>;
