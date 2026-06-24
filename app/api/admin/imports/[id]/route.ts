import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { importReviewService } from "@/services/import-review.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireRole("admin", "agent");
    const { id } = await params;
    const [job, records] = await Promise.all([
      importReviewService.getJob(id),
      importReviewService.getJobRecords(id),
    ]);
    return apiSuccess({ job, records });
  } catch (error) {
    return apiError(error);
  }
}
