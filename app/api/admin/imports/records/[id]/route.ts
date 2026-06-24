import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { importReviewService } from "@/services/import-review.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireRole("admin", "agent");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "approve") {
      const record = await importReviewService.approveRecord(
        id,
        session.userId,
        body.notes
      );
      return apiSuccess(record);
    }

    if (action === "reject") {
      const record = await importReviewService.rejectRecord(
        id,
        session.userId,
        body.notes
      );
      return apiSuccess(record);
    }

    if (action === "publish") {
      await requireRole("admin");
      const result = await importReviewService.publishRecord(id, session.userId);
      return apiSuccess(result);
    }

    return apiError(new Error(`Unknown action: ${action}`));
  } catch (error) {
    return apiError(error);
  }
}
