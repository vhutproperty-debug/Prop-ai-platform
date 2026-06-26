import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { missionControlService } from "@/services/mission-control/mission-control.service";
import { missionControlFilterSchema } from "@/validations/mission-control";

export async function GET(request: Request) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.has("_refresh");
    const filter = missionControlFilterSchema.parse(
      Object.fromEntries(searchParams.entries())
    );
    const data = await missionControlService.getDashboard(filter, {
      bypassCache,
    });
    return apiSuccess(data);
  } catch (error) {
    return apiError(error);
  }
}
