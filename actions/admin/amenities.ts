"use server";

import {
  bulkActionSchema,
  createAmenitySchema,
  updateAmenitySchema,
} from "@/validations/admin";
import { adminAmenityService } from "@/services/admin/amenities.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function createAmenityAction(input: unknown) {
  const data = createAmenitySchema.parse(input);
  return runAdminAction(() => adminAmenityService.create(data), ["/admin/amenities"]);
}

export async function updateAmenityAction(input: unknown) {
  const { id, ...data } = updateAmenitySchema.parse(input);
  return runAdminAction(
    () => adminAmenityService.update(id, data),
    ["/admin/amenities"]
  );
}

export async function deleteAmenityAction(id: string) {
  return runAdminAction(
    () => adminAmenityService.softDelete(id),
    ["/admin/amenities"]
  );
}

export async function bulkAmenityAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminAmenityService.bulkAction(ids, action),
    ["/admin/amenities"]
  );
}

export async function toggleAmenityActiveAction(id: string, isActive: boolean) {
  return runAdminAction(
    () => adminAmenityService.update(id, { isActive }),
    ["/admin/amenities"]
  );
}
