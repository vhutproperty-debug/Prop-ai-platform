import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { projectIntelligenceSaveSchema } from "@/validations/project-intelligence";
import { projectIntelligenceExtractorService } from "@/services/project-intelligence/project-intelligence-extractor.service";
import type { ProjectIntelligenceReport } from "@/types/project-intelligence";

export async function POST(request: Request) {
  try {
    const session = await requireRole("admin");
    const body = await request.json();
    const input = projectIntelligenceSaveSchema.parse(body);
    const saved = await projectIntelligenceExtractorService.save(
      input.report as unknown as ProjectIntelligenceReport,
      session.userId
    );
    return apiSuccess(saved, 201);
  } catch (error) {
    return apiError(error);
  }
}
