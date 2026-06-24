import { apiError, apiSuccess } from "@/lib/api/response";
import { projectService } from "@/services/catalog.service";
import { projectFilterSchema } from "@/validations/project";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = projectFilterSchema.parse(Object.fromEntries(searchParams));
    const result = await projectService.list(filters);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
