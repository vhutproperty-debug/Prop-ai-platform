import { z } from "zod";

export const missionControlFilterSchema = z.object({
  builderSlug: z.string().optional(),
  localitySlug: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const missionControlSearchSchema = z.object({
  q: z.string().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(25).optional(),
});
