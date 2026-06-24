import { apiError, apiSuccess } from "@/lib/api/response";
import { localityService } from "@/services/catalog.service";

export async function GET() {
  try {
    const result = await localityService.list();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
