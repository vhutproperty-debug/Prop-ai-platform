import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { projectIntelligenceExtractorService } from "@/services/project-intelligence/project-intelligence-extractor.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await context.params;
    const record = await projectIntelligenceExtractorService.getById(id);
    if (!record) {
      return apiError(new Error("Record not found"));
    }
    return apiSuccess(record);
  } catch (error) {
    return apiError(error);
  }
}
