"use server";

import {
  bulkActionSchema,
  createProjectSchema,
  projectFilterSchema,
  updateProjectSchema,
} from "@/validations/admin";
import { adminProjectService } from "@/services/admin/projects.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function listProjectsAction(
  raw: Record<string, string | string[] | undefined>
) {
  const filters = projectFilterSchema.parse(raw);
  return runAdminAction(() => adminProjectService.list(filters), [], [
    "admin",
    "agent",
  ]);
}

export async function getProjectAction(id: string) {
  return runAdminAction(() => adminProjectService.getById(id), [], [
    "admin",
    "agent",
  ]);
}

export async function createProjectAction(input: unknown) {
  const data = createProjectSchema.parse(input);
  return runAdminAction(
    () => adminProjectService.create(data),
    ["/admin/projects", "/admin/dashboard"]
  );
}

export async function updateProjectAction(input: unknown) {
  const { id, ...data } = updateProjectSchema.parse(input);
  return runAdminAction(
    () => adminProjectService.update(id, data),
    ["/admin/projects", `/admin/projects/${id}/edit`, "/admin/dashboard"]
  );
}

export async function deleteProjectAction(id: string) {
  return runAdminAction(
    () => adminProjectService.softDelete(id),
    ["/admin/projects", "/admin/dashboard"]
  );
}

export async function bulkProjectAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminProjectService.bulkAction(ids, action),
    ["/admin/projects", "/admin/dashboard"]
  );
}

export async function toggleProjectFeaturedAction(id: string, featured: boolean) {
  return runAdminAction(
    () => adminProjectService.update(id, { featured }),
    ["/admin/projects"]
  );
}

export async function toggleProjectActiveAction(id: string, isActive: boolean) {
  return runAdminAction(
    () => adminProjectService.update(id, { isActive }),
    ["/admin/projects", "/admin/dashboard"]
  );
}
