import { apiError, apiSuccess } from "@/lib/api/response";
import { searchAction } from "@/actions/search";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await searchAction(body);

    if (!result.success) {
      return apiError(new Error(result.error));
    }

    return apiSuccess(result.data);
  } catch (error) {
    return apiError(error);
  }
}
