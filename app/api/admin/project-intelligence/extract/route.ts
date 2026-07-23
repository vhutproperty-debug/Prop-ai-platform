import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { projectIntelligenceExtractSchema } from "@/validations/project-intelligence";
import { projectIntelligenceExtractorService } from "@/services/project-intelligence/project-intelligence-extractor.service";

export async function POST(request: Request) {
  try {
    await requireRole("admin");
    const body = await request.json();
    const input = projectIntelligenceExtractSchema.parse(body);
    const report = await projectIntelligenceExtractorService.extract(input.url);
    return apiSuccess(report);
  } catch (error) {
    return apiError(error);
  }
}
