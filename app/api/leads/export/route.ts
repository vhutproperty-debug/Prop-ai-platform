import { apiError } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { leadService } from "@/services/lead.service";
import { leadFilterSchema } from "@/validations/lead";

export async function GET(request: Request) {
  try {
    await requireRole("admin", "agent");
    const { searchParams } = new URL(request.url);
    const filters = leadFilterSchema.parse(Object.fromEntries(searchParams));
    const csv = await leadService.exportCsv(filters);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="propai-leads-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
