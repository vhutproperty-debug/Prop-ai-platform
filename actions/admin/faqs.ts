"use server";

import {
  bulkActionSchema,
  createFaqSchema,
  updateFaqSchema,
} from "@/validations/admin";
import { adminFaqService } from "@/services/admin/faqs.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function createFaqAction(input: unknown) {
  const data = createFaqSchema.parse(input);
  return runAdminAction(() => adminFaqService.create(data), ["/admin/faqs"]);
}

export async function updateFaqAction(input: unknown) {
  const { id, ...data } = updateFaqSchema.parse(input);
  return runAdminAction(() => adminFaqService.update(id, data), ["/admin/faqs"]);
}

export async function deleteFaqAction(id: string) {
  return runAdminAction(() => adminFaqService.softDelete(id), ["/admin/faqs"]);
}

export async function bulkFaqAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminFaqService.bulkAction(ids, action),
    ["/admin/faqs"]
  );
}

export async function toggleFaqActiveAction(id: string, isActive: boolean) {
  return runAdminAction(
    () => adminFaqService.update(id, { isActive }),
    ["/admin/faqs"]
  );
}
