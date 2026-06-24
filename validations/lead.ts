import { z } from "zod";
import {
  LEAD_SCORES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/config/constants";
import { emailSchema, paginationSchema, phoneSchema } from "@/validations/common";
import { normalizeLeadSource } from "@/lib/leads/normalize";

const budgetSchema = z
  .object({
    min: z.number().nonnegative().optional(),
    max: z.number().nonnegative().optional(),
    currency: z.string().default("INR"),
  })
  .optional();

export const createLeadSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema,
  source: z.preprocess(
    (value) => normalizeLeadSource(String(value ?? "homepage")),
    z.enum(LEAD_SOURCES)
  ),
  projectId: z.string().optional(),
  projectSlug: z.string().max(120).optional(),
  builderId: z.string().optional(),
  locationId: z.string().optional(),
  /** @deprecated Use projectId */
  project: z.string().optional(),
  /** @deprecated Use locationId */
  locality: z.string().optional(),
  budget: budgetSchema,
  configuration: z.string().max(120).optional(),
  timeline: z.string().max(120).optional(),
  purpose: z.string().max(200).optional(),
  score: z.enum(LEAD_SCORES).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  query: z.string().max(1000).optional(),
  assignedTo: z.string().optional(),
  aiAnswers: z.record(z.string(), z.string()).optional(),
});

export const updateLeadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  score: z.enum(LEAD_SCORES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  budget: budgetSchema,
  configuration: z.string().max(120).optional(),
  timeline: z.string().max(120).optional(),
  purpose: z.string().max(200).optional(),
  projectId: z.string().optional(),
  projectSlug: z.string().max(120).optional(),
  assignedTo: z.string().nullable().optional(),
  note: z.string().max(5000).optional(),
});

export const addLeadNoteSchema = z.object({
  leadId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export const assignLeadSchema = z.object({
  leadId: z.string().min(1),
  assignedTo: z.string().nullable(),
});

export const leadFilterSchema = z.object({
  search: z.string().max(120).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  score: z.enum(LEAD_SCORES).optional(),
  assignedTo: z.string().optional(),
  unassigned: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  projectSlug: z.string().optional(),
  ...paginationSchema.shape,
});

export const leadBulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["delete", "assign", "set_status", "set_score"]),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  score: z.enum(LEAD_SCORES).optional(),
});

export const kanbanFilterSchema = leadFilterSchema.omit({ page: true, limit: true });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type AddLeadNoteInput = z.infer<typeof addLeadNoteSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
export type LeadBulkActionInput = z.infer<typeof leadBulkActionSchema>;
