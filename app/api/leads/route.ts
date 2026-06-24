import { apiError, apiSuccess } from "@/lib/api/response";
import { isDbConfigured } from "@/config/env";
import { createLeadAction } from "@/actions/leads";
import { leadService } from "@/services/lead.service";
import { createLeadSchema, leadFilterSchema } from "@/validations/lead";
import { requireRole } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    await requireRole("admin", "agent");
    const { searchParams } = new URL(request.url);
    const filters = leadFilterSchema.parse(Object.fromEntries(searchParams));
    const result = await leadService.list(filters);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createLeadSchema.parse(body);

    if (!isDbConfigured) {
      return apiSuccess(
        { ...input, status: "NEW", message: "Lead captured (DB unavailable)" },
        201
      );
    }

    const result = await createLeadAction(input);
    if (!result.success) {
      return apiError(new Error(result.error));
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    return apiError(error);
  }
}
