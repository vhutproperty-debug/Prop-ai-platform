import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { ingestionService } from "@/services/ingestion.service";
import { importReviewService } from "@/services/import-review.service";
import { ingestionRequestSchema } from "@/validations/ingestion";

export async function GET() {
  try {
    await requireRole("admin", "agent");
    const result = await importReviewService.listJobs();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("admin", "agent");
    const body = await request.json();
    const input = ingestionRequestSchema.parse(body);
    const result = await ingestionService.ingest({
      ...input,
      createdBy: session.userId,
    });
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
