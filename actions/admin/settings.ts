"use server";

import { siteSettingsSchema } from "@/validations/admin";
import { adminSettingsService } from "@/services/admin/settings.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function getSettingsAction() {
  return runAdminAction(() => adminSettingsService.get(), [], ["admin", "agent"]);
}

export async function updateSettingsAction(input: unknown) {
  const data = siteSettingsSchema.parse(input);
  return runAdminAction(
    () => adminSettingsService.update(data),
    ["/admin/settings"]
  );
}
