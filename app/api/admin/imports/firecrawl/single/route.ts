import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { importJobsService } from "@/services/import-jobs/import-jobs.service";
import { z } from "zod";

const singleImportSchema = z.object({
  builderSlug: z.string().min(2),
  projectUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole("admin");
    const body = await request.json();
    const input = singleImportSchema.parse(body);
    const result = await importJobsService.runSingleProjectImport({
      builderSlug: input.builderSlug,
      projectUrl: input.projectUrl,
      createdBy: session.userId,
    });
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
