"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAdminLeadAction } from "@/actions/admin/leads";
import { LEAD_SCORES, LEAD_SOURCES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/leads/labels";

export function CreateLeadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone")),
      source: String(formData.get("source")),
      score: String(formData.get("score")),
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
      const result = await createAdminLeadAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="accent" onClick={() => setOpen(true)}>
        New Lead
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-white p-6"
    >
      <h3 className="text-lg font-semibold">Create Lead</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input name="phone" required />
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <select name="source" defaultValue="manual" className="flex h-14 w-full rounded-2xl border border-border px-5">
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Score</Label>
          <select name="score" defaultValue="warm" className="flex h-14 w-full rounded-2xl border border-border px-5">
            {LEAD_SCORES.map((s) => (
              <option key={s} value={s}>{LEAD_SCORE_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Project Slug</Label>
          <Input name="projectSlug" />
        </div>
        <div className="space-y-2">
          <Label>Configuration</Label>
          <Input name="configuration" placeholder="2 BHK" />
        </div>
        <div className="space-y-2">
          <Label>Timeline</Label>
          <Input name="timeline" placeholder="3-6 months" />
        </div>
        <div className="space-y-2">
          <Label>Purpose</Label>
          <Input name="purpose" placeholder="Investment" />
        </div>
        <div className="space-y-2">
          <Label>Budget Min (INR)</Label>
          <Input name="budgetMin" type="number" />
        </div>
        <div className="space-y-2">
          <Label>Budget Max (INR)</Label>
          <Input name="budgetMax" type="number" />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 flex gap-3">
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? "Creating..." : "Create Lead"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
