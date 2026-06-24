"use server";

import { ZodError } from "zod";
import { actionError, actionSuccess } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { embeddingService } from "@/services/embedding.service";
import { searchService } from "@/services/catalog.service";
import { searchQuerySchema } from "@/validations/search";

export async function searchAction(input: unknown) {
  try {
    const { query, limit, mode } = searchQuerySchema.parse(input);

    const keywordResults = searchService.keywordSearch(query, limit);
    const hybrid = await searchService.hybridSearch(query, limit);

    let semanticResults: Awaited<ReturnType<typeof embeddingService.searchSimilar>> = [];
    if (mode === "semantic" || mode === "hybrid") {
      semanticResults = await embeddingService.searchSimilar(query, limit);
    }

    return actionSuccess({
      query,
      mode,
      suggestions: keywordResults,
      projects: hybrid.projects,
      semantic: semanticResults,
      aiResponse:
        hybrid.projects.length || keywordResults.length
          ? `Found ${keywordResults.length} suggestions and ${hybrid.projects.length} matching projects for "${query}".`
          : `No exact matches for "${query}". Try refining your search with locality, BHK, or budget.`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(new ValidationError("Validation failed", error.flatten().fieldErrors));
    }
    return actionError(error);
  }
}
