import { z } from "zod";
import { PROJECT_STATUSES } from "@/config/constants";
import { projectSchema } from "@/validations/models";

export const projectFilterSchema = z.object({
  featured: z.coerce.boolean().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  locality: z.string().optional(),
  builder: z.string().optional(),
  microMarket: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createProjectSchema = projectSchema;

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
