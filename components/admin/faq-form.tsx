"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createFaqAction } from "@/actions/admin/faqs";
import { FAQ_ENTITY_TYPES } from "@/config/model-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Option {
  _id: string;
  name: string;
}

export function FaqForm({ projects }: { projects: Option[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      entityType: String(formData.get("entityType")) as "project",
      entityId: String(formData.get("entityId")),
      question: String(formData.get("question")),
      answer: String(formData.get("answer")),
      order: Number(formData.get("order") || 0),
      isActive: true,
    };

    startTransition(async () => {
      const result = await createFaqAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      event.currentTarget.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Add FAQ</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Entity Type</Label>
          <select name="entityType" defaultValue="project" className="flex h-14 w-full rounded-2xl border border-border px-5">
            {FAQ_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Project</Label>
          <select name="entityId" required className="flex h-14 w-full rounded-2xl border border-border px-5">
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Question</Label>
          <Input name="question" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Answer</Label>
          <Textarea name="answer" rows={3} required />
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Input name="order" type="number" min="0" defaultValue={0} />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button type="submit" variant="accent" className="mt-4" disabled={isPending}>
        {isPending ? "Creating..." : "Create FAQ"}
      </Button>
    </form>
  );
}
