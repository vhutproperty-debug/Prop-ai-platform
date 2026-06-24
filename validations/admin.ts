import { z } from "zod";
import { PROJECT_STATUSES } from "@/config/constants";
import {
  LEAD_SCORES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/config/constants";
import {
  AMENITY_CATEGORIES,
  FAQ_ENTITY_TYPES,
  IMAGE_ENTITY_TYPES,
  IMAGE_TYPES,
} from "@/config/model-constants";
import { paginationSchema } from "@/validations/common";
import {
  amenitySchema,
  builderSchema,
  configurationSchema,
  faqSchema,
  projectSchema,
} from "@/validations/models";

export const adminSearchSchema = z.object({
  search: z.string().max(120).optional(),
  ...paginationSchema.shape,
});

export const builderFilterSchema = adminSearchSchema.extend({
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
  isFeatured: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const projectFilterSchema = adminSearchSchema.extend({
  status: z.enum(PROJECT_STATUSES).optional(),
  builderId: z.string().optional(),
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
  featured: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const configurationFilterSchema = adminSearchSchema.extend({
  projectId: z.string().optional(),
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const amenityFilterSchema = adminSearchSchema.extend({
  category: z.enum(AMENITY_CATEGORIES).optional(),
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const faqFilterSchema = adminSearchSchema.extend({
  entityType: z.enum(FAQ_ENTITY_TYPES).optional(),
  entityId: z.string().optional(),
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const mediaFilterSchema = adminSearchSchema.extend({
  entityType: z.enum(IMAGE_ENTITY_TYPES).optional(),
  type: z.enum(IMAGE_TYPES).optional(),
  isActive: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || !v ? undefined : v === "true")),
});

export const leadFilterSchema = adminSearchSchema.extend({
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  score: z.enum(LEAD_SCORES).optional(),
  assignedTo: z.string().optional(),
  unassigned: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "true" ? true : undefined)),
  projectSlug: z.string().optional(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum([
    "publish",
    "unpublish",
    "feature",
    "unfeature",
    "delete",
  ]),
});

export const createBuilderSchema = builderSchema;
export const updateBuilderSchema = builderSchema.partial().extend({
  id: z.string().min(1),
});

export const createProjectSchema = projectSchema;
export const updateProjectSchema = projectSchema.partial().extend({
  id: z.string().min(1),
});

export const createConfigurationSchema = configurationSchema;
export const updateConfigurationSchema = configurationSchema
  .partial()
  .extend({ id: z.string().min(1) });

export const createAmenitySchema = amenitySchema;
export const updateAmenitySchema = amenitySchema.partial().extend({
  id: z.string().min(1),
});

export const createFaqSchema = faqSchema;
export const updateFaqSchema = faqSchema.partial().extend({ id: z.string().min(1) });

export const siteSettingsSchema = z.object({
  siteName: z.string().min(2).max(120),
  siteUrl: z.string().url(),
  defaultSeoTitle: z.string().max(160),
  defaultSeoDescription: z.string().max(320),
  brandAccentColor: z.string().max(20),
  brandLogoUrl: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      facebook: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  maintenanceMode: z.boolean().default(false),
});

export const uploadMediaSchema = z.object({
  entityType: z.enum(IMAGE_ENTITY_TYPES).default("project"),
  entityId: z.string().min(1),
  type: z.enum(IMAGE_TYPES).default("gallery"),
  alt: z.string().max(200).optional(),
});

export type BuilderFilterInput = z.infer<typeof builderFilterSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
export type ConfigurationFilterInput = z.infer<typeof configurationFilterSchema>;
export type AmenityFilterInput = z.infer<typeof amenityFilterSchema>;
export type FaqFilterInput = z.infer<typeof faqFilterSchema>;
export type MediaFilterInput = z.infer<typeof mediaFilterSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
