import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { adminNearbyPlaceService } from "@/services/admin/nearby-places.service";
import { nearbyPlaceService } from "@/services/location-intelligence/nearby-place.service";
import { updateNearbyPlaceSchema } from "@/validations/location-intelligence";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireRole("admin", "agent");
    const { id } = await context.params;
    const item = await nearbyPlaceService.getById(id);
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole("admin", "agent");
    const { id } = await context.params;
    const body = await request.json();
    const input = updateNearbyPlaceSchema.parse({ ...body, id });
    const { id: placeId, ...data } = input;
    const updated = await adminNearbyPlaceService.update(placeId, data);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireRole("admin", "agent");
    const { id } = await context.params;
    await adminNearbyPlaceService.softDelete(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
