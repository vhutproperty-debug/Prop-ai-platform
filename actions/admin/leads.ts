"use server";

import { bulkActionSchema } from "@/validations/admin";
import { updateLeadSchema } from "@/validations/lead";
import { adminLeadService } from "@/services/admin/leads.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function updateAdminLeadAction(input: unknown) {
  const data = updateLeadSchema.parse(input);
  return runAdminAction(
    () => adminLeadService.update(data),
    ["/admin/leads"]
  );
}

export async function deleteAdminLeadAction(id: string) {
  return runAdminAction(() => adminLeadService.remove(id), ["/admin/leads"]);
}

export async function bulkLeadAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminLeadService.bulkAction(ids, action),
    ["/admin/leads"]
  );
}
