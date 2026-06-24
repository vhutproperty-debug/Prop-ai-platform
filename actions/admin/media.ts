"use server";

import { bulkActionSchema, uploadMediaSchema } from "@/validations/admin";
import { adminMediaService } from "@/services/admin/media.service";
import { runAdminAction } from "@/actions/admin/helpers";

export async function uploadMediaAction(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("No file provided");
    }

    const meta = uploadMediaSchema.parse({
      entityType: formData.get("entityType") ?? "project",
      entityId: formData.get("entityId"),
      type: formData.get("type") ?? "gallery",
      alt: formData.get("alt") ?? undefined,
    });

    return runAdminAction(
      () => adminMediaService.uploadAndCreate(file, meta),
      ["/admin/media"]
    );
  } catch (error) {
    const { actionError } = await import("@/lib/api/response");
    return actionError(error);
  }
}

export async function uploadMultipleMediaAction(formData: FormData) {
  const files = formData.getAll("files").filter((f) => f instanceof File) as File[];
  if (!files.length) {
    const { actionError } = await import("@/lib/api/response");
    return actionError(new Error("No files provided"));
  }

  const meta = uploadMediaSchema.parse({
    entityType: formData.get("entityType") ?? "project",
    entityId: formData.get("entityId"),
    type: formData.get("type") ?? "gallery",
  });

  return runAdminAction(async () => {
    const uploads = await Promise.all(
      files.map((file) => adminMediaService.uploadAndCreate(file, meta))
    );
    return uploads;
  }, ["/admin/media"]);
}

export async function deleteMediaAction(id: string) {
  return runAdminAction(
    () => adminMediaService.hardDelete(id),
    ["/admin/media"]
  );
}

export async function bulkMediaAction(input: unknown) {
  const { ids, action } = bulkActionSchema.parse(input);
  return runAdminAction(
    () => adminMediaService.bulkAction(ids, action),
    ["/admin/media"]
  );
}
