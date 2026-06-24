"use server";

import {
  bulkActionSchema,
  builderFilterSchema,
  createBuilderSchema,
  updateBuilderSchema,
} from "@/validations/admin";
import { adminBuilderService } from "@/services/admin/builders.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function listBuildersAction(
  raw: Record<string, string | string[] | undefined>
) {
  const filters = builderFilterSchema.parse(raw);
  return runAdminAction(() => adminBuilderService.list(filters), [], [
    "admin",
    "agent",
  ]);
}

export async function getBuilderAction(id: string) {
  return runAdminAction(() => adminBuilderService.getById(id), [], [
    "admin",
    "agent",
  ]);
}

export async function createBuilderAction(input: unknown) {
  const data = createBuilderSchema.parse(input);
  return runAdminAction(
    () => adminBuilderService.create(data),
    ["/admin/builders"]
  );
}

export async function updateBuilderAction(input: unknown) {
  const { id, ...data } = updateBuilderSchema.parse(input);
  return runAdminAction(
    () => adminBuilderService.update(id, data),
    ["/admin/builders", `/admin/builders/${id}/edit`]
  );
}

export async function deleteBuilderAction(id: string) {
  return runAdminAction(
    () => adminBuilderService.softDelete(id),
    ["/admin/builders"]
  );
}

export async function bulkBuilderAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminBuilderService.bulkAction(ids, action),
    ["/admin/builders"]
  );
}

export async function toggleBuilderFeaturedAction(id: string, featured: boolean) {
  return runAdminAction(
    () => adminBuilderService.update(id, { isFeatured: featured }),
    ["/admin/builders"]
  );
}

export async function toggleBuilderActiveAction(id: string, isActive: boolean) {
  return runAdminAction(
    () => adminBuilderService.update(id, { isActive }),
    ["/admin/builders"]
  );
}
