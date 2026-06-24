import { apiError, apiSuccess } from "@/lib/api/response";
import { builderService } from "@/services/catalog.service";

export async function GET() {
  try {
    const result = await builderService.list();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
