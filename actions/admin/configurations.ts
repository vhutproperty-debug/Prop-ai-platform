"use server";

import {
  bulkActionSchema,
  createConfigurationSchema,
  updateConfigurationSchema,
} from "@/validations/admin";
import { adminConfigurationService } from "@/services/admin/configurations.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function createConfigurationAction(input: unknown) {
  const data = createConfigurationSchema.parse(input);
  return runAdminAction(
    () => adminConfigurationService.create(data),
    ["/admin/configurations"]
  );
}

export async function updateConfigurationAction(input: unknown) {
  const { id, ...data } = updateConfigurationSchema.parse(input);
  return runAdminAction(
    () => adminConfigurationService.update(id, data),
    ["/admin/configurations"]
  );
}

export async function deleteConfigurationAction(id: string) {
  return runAdminAction(
    () => adminConfigurationService.softDelete(id),
    ["/admin/configurations"]
  );
}

export async function bulkConfigurationAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminConfigurationService.bulkAction(ids, action),
    ["/admin/configurations"]
  );
}

export async function toggleConfigurationActiveAction(
  id: string,
  isActive: boolean
) {
  return runAdminAction(
    () => adminConfigurationService.update(id, { isActive }),
    ["/admin/configurations"]
  );
}
