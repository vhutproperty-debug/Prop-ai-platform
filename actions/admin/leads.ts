"use server";

import type { LeadStatus } from "@/config/constants";
import {
  addLeadNoteSchema,
  assignLeadSchema,
  createLeadSchema,
  leadBulkActionSchema,
  updateLeadSchema,
} from "@/validations/lead";
import { adminLeadService } from "@/services/admin/leads.service";
import { getSession, requireRole } from "@/lib/auth/session";
import { runAdminAction } from "@/actions/admin/helpers";

async function getActor() {
  const session = await getSession();
  return session
    ? { actorId: session.userId, actorName: session.email }
    : undefined;
}

export async function createAdminLeadAction(input: unknown) {
  const data = createLeadSchema.parse(input);
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.create(data, actor),
    ["/admin/leads", "/admin/dashboard"]
  );
}

export async function updateAdminLeadAction(input: unknown) {
  const data = updateLeadSchema.parse(input);
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.update(data, actor),
    ["/admin/leads", `/admin/leads/${data.id}`, "/admin/dashboard"]
  );
}

export async function addLeadNoteAction(input: unknown) {
  const data = addLeadNoteSchema.parse(input);
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.addNote(data, actor),
    [`/admin/leads/${data.leadId}`]
  );
}

export async function assignLeadAction(input: unknown) {
  const data = assignLeadSchema.parse(input);
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.assign(data, actor),
    ["/admin/leads", `/admin/leads/${data.leadId}`]
  );
}

export async function deleteAdminLeadAction(id: string) {
  return runAdminAction(
    () => adminLeadService.remove(id),
    ["/admin/leads", "/admin/dashboard"]
  );
}

export async function bulkLeadAction(input: unknown) {
  const data = leadBulkActionSchema.parse(input);
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.bulkAction(data, actor),
    ["/admin/leads", "/admin/dashboard"]
  );
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  await requireRole("admin", "agent");
  const data = updateLeadSchema.parse({ id: leadId, status });
  const actor = await getActor();
  return runAdminAction(
    () => adminLeadService.update(data, actor),
    ["/admin/leads", `/admin/leads/${leadId}`]
  );
}
