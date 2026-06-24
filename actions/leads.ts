"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { actionError, actionSuccess } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { getSession, requireRole } from "@/lib/auth/session";
import { leadService } from "@/services/lead.service";
import {
  createLeadSchema,
  updateLeadSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
} from "@/validations/lead";

async function getActor() {
  const session = await getSession();
  return session
    ? { actorId: session.userId, actorName: session.email }
    : undefined;
}

export async function createLeadAction(input: CreateLeadInput) {
  try {
    const data = createLeadSchema.parse(input);
    const lead = await leadService.create(data, await getActor());
    revalidatePath("/admin/leads");
    return actionSuccess(lead);
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(
        new ValidationError("Validation failed", error.flatten().fieldErrors)
      );
    }
    return actionError(error);
  }
}

export async function updateLeadAction(input: UpdateLeadInput) {
  try {
    await requireRole("admin", "agent");
    const data = updateLeadSchema.parse(input);
    const lead = await leadService.update(data, await getActor());
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${data.id}`);
    return actionSuccess(lead);
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(
        new ValidationError("Validation failed", error.flatten().fieldErrors)
      );
    }
    return actionError(error);
  }
}

export async function deleteLeadAction(id: string) {
  try {
    await requireRole("admin");
    const lead = await leadService.remove(id);
    revalidatePath("/admin/leads");
    return actionSuccess(lead);
  } catch (error) {
    return actionError(error);
  }
}
