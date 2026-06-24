"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignLeadAction,
  deleteAdminLeadAction,
  updateAdminLeadAction,
} from "@/actions/admin/leads";
import { LEAD_SCORES, LEAD_SOURCES, LEAD_STATUSES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getScoreBadgeClass,
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/labels";
import type { AgentOption, Lead } from "@/types/lead";
import { cn } from "@/lib/utils";

export function LeadDetailForm({
  lead,
  agents,
}: {
  lead: Lead;
  agents: AgentOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const payload = {
      id: lead._id,
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone")),
      status: String(formData.get("status")),
      score: String(formData.get("score")),
      source: String(formData.get("source")),
      configuration: String(formData.get("configuration") || "") || undefined,
      timeline: String(formData.get("timeline") || "") || undefined,
      purpose: String(formData.get("purpose") || "") || undefined,
      projectSlug: String(formData.get("projectSlug") || "") || undefined,
      budget: formData.get("budgetMin")
        ? {
            min: Number(formData.get("budgetMin")),
            max: Number(formData.get("budgetMax") || formData.get("budgetMin")),
          }
        : undefined,
    };

    startTransition(async () => {
      const result = await updateAdminLeadAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleAssign(agentId: string) {
    startTransition(async () => {
      await assignLeadAction({
        leadId: lead._id,
        assignedTo: agentId || null,
      });
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAdminLeadAction(lead._id);
      router.push("/admin/leads");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Lead ID</p>
          <p className="font-mono text-sm">{lead._id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              getScoreBadgeClass(lead.score)
            )}
          >
            {LEAD_SCORE_LABELS[lead.score]}
          </span>
          <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs">
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" defaultValue={lead.name} required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={lead.email} required />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input name="phone" defaultValue={lead.phone} required />
        </div>
        <div className="space-y-2">
          <Label>Project Slug</Label>
          <Input name="projectSlug" defaultValue={lead.projectSlug} />
          {lead.projectSlug ? (
            <Link
              href={`/project/${lead.projectSlug}`}
              className="text-xs text-accent hover:underline"
              target="_blank"
            >
              View project page
            </Link>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={lead.status}
            className="flex h-14 w-full rounded-2xl border border-border px-5"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Score</Label>
          <select
            name="score"
            defaultValue={lead.score}
            className="flex h-14 w-full rounded-2xl border border-border px-5"
          >
            {LEAD_SCORES.map((s) => (
              <option key={s} value={s}>{LEAD_SCORE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <select
            name="source"
            defaultValue={lead.source}
            className="flex h-14 w-full rounded-2xl border border-border px-5"
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Assign Agent</Label>
          <select
            defaultValue={lead.assignedTo ?? ""}
            onChange={(e) => handleAssign(e.target.value)}
            className="flex h-14 w-full rounded-2xl border border-border px-5"
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Configuration</Label>
          <Input name="configuration" defaultValue={lead.configuration} />
        </div>
        <div className="space-y-2">
          <Label>Timeline</Label>
          <Input name="timeline" defaultValue={lead.timeline} />
        </div>
        <div className="space-y-2">
          <Label>Purpose</Label>
          <Input name="purpose" defaultValue={lead.purpose} />
        </div>
        <div className="space-y-2">
          <Label>Budget Min</Label>
          <Input
            name="budgetMin"
            type="number"
            defaultValue={lead.budget?.min}
          />
        </div>
        <div className="space-y-2">
          <Label>Budget Max</Label>
          <Input
            name="budgetMax"
            type="number"
            defaultValue={lead.budget?.max}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={handleDelete}>
          Delete Lead
        </Button>
      </div>
    </form>
  );
}
