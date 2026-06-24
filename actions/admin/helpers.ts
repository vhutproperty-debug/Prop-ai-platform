"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { actionError, actionSuccess, type ActionResult } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/config/constants";

export async function requireAdminRead() {
  await requireRole("admin", "agent");
}

export async function requireAdminWrite() {
  await requireRole("admin");
}

export async function runAdminAction<T>(
  fn: () => Promise<T>,
  revalidatePaths: string[] = [],
  roles: UserRole[] = ["admin"]
): Promise<ActionResult<T>> {
  try {
    await requireRole(...roles);
    const data = await fn();
    for (const path of revalidatePaths) {
      revalidatePath(path);
    }
    return actionSuccess(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(
        new ValidationError("Validation failed", error.flatten().fieldErrors)
      );
    }
    return actionError(error);
  }
}
