import { z } from "zod";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/config/constants";
import { emailSchema, phoneSchema } from "@/validations/common";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  phone: phoneSchema,
  source: z.enum(LEAD_SOURCES).default("website"),
  projectId: z.string().optional(),
  builderId: z.string().optional(),
  locationId: z.string().optional(),
  /** @deprecated Use projectId */
  project: z.string().optional(),
  /** @deprecated Use locationId */
  locality: z.string().optional(),
  query: z.string().max(1000).optional(),
  budget: z
    .object({
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
    })
    .optional(),
  aiAnswers: z.record(z.string(), z.string()).optional(),
});

export const updateLeadSchema = z.object({
  id: z.string().min(1),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().optional(),
});

export const leadFilterSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
