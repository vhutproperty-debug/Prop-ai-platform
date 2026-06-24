import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { importJobsService } from "@/services/import-jobs/import-jobs.service";
import { z } from "zod";

const firecrawlImportSchema = z.object({
  builderSlug: z.string().min(2),
  maxProjects: z.number().int().min(1).max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole("admin");
    const body = await request.json();
    const input = firecrawlImportSchema.parse(body);
    const result = await importJobsService.runBuilderImport({
      builderSlug: input.builderSlug,
      maxProjects: input.maxProjects,
      createdBy: session.userId,
    });
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
