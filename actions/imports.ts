"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { ingestionService } from "@/services/ingestion.service";
import { importReviewService } from "@/services/import-review.service";
import { ingestionRequestSchema } from "@/validations/ingestion";

export async function runImportAction(input: unknown) {
  try {
    const session = await requireRole("admin", "agent");
    const data = ingestionRequestSchema.parse(input);
    const result = await ingestionService.ingest({
      ...data,
      createdBy: session.userId,
    });
    revalidatePath("/admin/imports");
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function approveImportRecordAction(
  recordId: string,
  notes?: string
) {
  try {
    const session = await requireRole("admin", "agent");
    const record = await importReviewService.approveRecord(
      recordId,
      session.userId,
      notes
    );
    revalidatePath("/admin/imports");
    revalidatePath(`/admin/imports/${record.jobId}`);
    return actionSuccess(record);
  } catch (error) {
    return actionError(error);
  }
}

export async function rejectImportRecordAction(
  recordId: string,
  notes?: string
) {
  try {
    const session = await requireRole("admin", "agent");
    const record = await importReviewService.rejectRecord(
      recordId,
      session.userId,
      notes
    );
    revalidatePath("/admin/imports");
    revalidatePath(`/admin/imports/${record.jobId}`);
    return actionSuccess(record);
  } catch (error) {
    return actionError(error);
  }
}

export async function publishImportRecordAction(recordId: string) {
  try {
    const session = await requireRole("admin");
    const result = await importReviewService.publishRecord(
      recordId,
      session.userId
    );
    revalidatePath("/admin/imports");
    revalidatePath(`/admin/imports/${result.record?.jobId}`);
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
