import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(500, "Search query is too long"),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  mode: z.enum(["keyword", "semantic", "hybrid"]).default("hybrid"),
});

export const embeddingSchema = z.object({
  entityType: z.enum(["project", "locality", "builder"]),
  entityId: z.string().min(1),
  content: z.string().min(10).max(10000),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type EmbeddingInput = z.infer<typeof embeddingSchema>;
