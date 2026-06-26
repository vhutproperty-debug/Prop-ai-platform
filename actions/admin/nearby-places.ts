"use server";

import { bulkActionSchema } from "@/validations/admin";
import {
  createNearbyPlaceSchema,
  updateNearbyPlaceSchema,
} from "@/validations/location-intelligence";
import { adminNearbyPlaceService } from "@/services/admin/nearby-places.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function createNearbyPlaceAction(input: unknown) {
  const data = createNearbyPlaceSchema.parse(input);
  return runAdminAction(
    () => adminNearbyPlaceService.create(data),
    ["/admin/nearby-places"]
  );
}

export async function updateNearbyPlaceAction(input: unknown) {
  const { id, ...data } = updateNearbyPlaceSchema.parse(input);
  return runAdminAction(
    () => adminNearbyPlaceService.update(id, data),
    ["/admin/nearby-places"]
  );
}

export async function deleteNearbyPlaceAction(id: string) {
  return runAdminAction(
    () => adminNearbyPlaceService.softDelete(id),
    ["/admin/nearby-places"]
  );
}

export async function bulkNearbyPlaceAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminNearbyPlaceService.bulkAction(ids, action),
    ["/admin/nearby-places"]
  );
}

export async function toggleNearbyPlaceActiveAction(id: string, isActive: boolean) {
  return runAdminAction(
    () => adminNearbyPlaceService.update(id, { isActive }),
    ["/admin/nearby-places"]
  );
}
