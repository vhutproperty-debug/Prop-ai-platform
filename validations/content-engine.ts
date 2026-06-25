import { z } from "zod";
import {
  CONTENT_AUTHOR_TYPES,
  CONTENT_STATUSES,
  CONTENT_TYPES,
} from "@/config/content-engine";
import { paginationSchema } from "@/validations/common";

export const contentFilterSchema = z.object({
  search: z.string().max(120).optional(),
  ...paginationSchema.shape,
  status: z.enum(CONTENT_STATUSES).optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
  projectSlug: z.string().optional(),
  builderSlug: z.string().optional(),
  localitySlug: z.string().optional(),
  authorType: z.enum(CONTENT_AUTHOR_TYPES).optional(),
  campaignId: z.string().optional(),
  isAiGenerated: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === "all" || v === undefined ? undefined : v === "true")),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const contentGenerationSchema = z.object({
  projectId: z.string().min(1),
  contentTypes: z.array(z.enum(CONTENT_TYPES)).min(1).max(20),
  quantityPerType: z.number().int().min(1).max(5).optional(),
  campaignId: z.string().optional(),
});

export const contentScheduleSchema = z.object({
  articleId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  priority: z.number().int().min(0).max(100).optional(),
  campaignId: z.string().optional(),
});

export type ContentFilterInput = z.infer<typeof contentFilterSchema>;
export type ContentGenerationInput = z.infer<typeof contentGenerationSchema>;
export type ContentScheduleInput = z.infer<typeof contentScheduleSchema>;
