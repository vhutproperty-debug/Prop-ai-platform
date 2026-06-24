"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/session";
import { importJobsService } from "@/services/import-jobs/import-jobs.service";
import { reviewService } from "@/services/review/review.service";
import { z } from "zod";

const firecrawlImportSchema = z.object({
  builderSlug: z.string().min(2),
  maxProjects: z.number().int().min(1).max(200).optional(),
});

export async function runFirecrawlImportAction(input: unknown) {
  try {
    const session = await requireRole("admin");
    const data = firecrawlImportSchema.parse(input);
    const result = await importJobsService.runBuilderImport({
      builderSlug: data.builderSlug,
      maxProjects: data.maxProjects,
      createdBy: session.userId,
    });
    revalidatePath("/admin/imports");
    revalidatePath("/admin/imports/review");
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function runAllFirecrawlImportsAction(maxProjectsPerBuilder?: number) {
  try {
    const session = await requireRole("admin");
    const result = await importJobsService.runAllBuildersImport({
      createdBy: session.userId,
      maxProjectsPerBuilder,
    });
    revalidatePath("/admin/imports");
    revalidatePath("/admin/imports/review");
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}

export async function mergeImportRecordAction(
  recordId: string,
  targetProjectId: string
) {
  try {
    const session = await requireRole("admin");
    const result = await reviewService.mergeRecord(
      recordId,
      targetProjectId,
      session.userId
    );
    revalidatePath("/admin/imports");
    revalidatePath("/admin/imports/review");
    return actionSuccess(result);
  } catch (error) {
    return actionError(error);
  }
}
