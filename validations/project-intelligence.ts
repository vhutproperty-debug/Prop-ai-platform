import { z } from "zod";

export const projectIntelligenceExtractSchema = z.object({
  url: z.string().url("Enter a valid builder project URL"),
  refresh: z.boolean().optional(),
});

export const projectIntelligenceSaveSchema = z.object({
  report: z.record(z.string(), z.unknown()),
});
