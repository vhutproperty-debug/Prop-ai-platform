import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { adminNearbyPlaceService } from "@/services/admin/nearby-places.service";
import {
  createNearbyPlaceSchema,
  nearbyPlaceFilterSchema,
} from "@/validations/location-intelligence";

export async function GET(request: Request) {
  try {
    await requireRole("admin", "agent");
    const { searchParams } = new URL(request.url);
    const filters = nearbyPlaceFilterSchema.parse(
      Object.fromEntries(searchParams.entries())
    );
    const result = await adminNearbyPlaceService.list(filters);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("admin", "agent");
    const body = await request.json();
    const input = createNearbyPlaceSchema.parse(body);
    const created = await adminNearbyPlaceService.create(input);
    return apiSuccess(created, 201);
  } catch (error) {
    return apiError(error);
  }
}
