import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { missionControlSearchService } from "@/services/mission-control/global-search.service";
import { missionControlSearchSchema } from "@/validations/mission-control";

export async function GET(request: Request) {
  try {
    await requireRole("admin");
    const { searchParams } = new URL(request.url);
    const input = missionControlSearchSchema.parse({
      q: searchParams.get("q") ?? "",
      limit: searchParams.get("limit") ?? undefined,
    });
    const results = await missionControlSearchService.search(input.q, input.limit);
    return apiSuccess({ results });
  } catch (error) {
    return apiError(error);
  }
}
