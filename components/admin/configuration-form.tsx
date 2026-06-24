"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createConfigurationAction } from "@/actions/admin/configurations";
import { CONFIGURATION_TYPES } from "@/config/model-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

interface Option {
  _id: string;
  name: string;
}

export function ConfigurationForm({ projects }: { projects: Option[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      projectId: String(formData.get("projectId")),
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      type: String(formData.get("type")),
      bhk: formData.get("bhk") ? Number(formData.get("bhk")) : undefined,
      priceRange: {
        min: Number(formData.get("priceMin")),
        max: Number(formData.get("priceMax")),
        currency: "INR",
      },
      isActive: true,
    };

    startTransition(async () => {
      const result = await createConfigurationAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      event.currentTarget.reset();
      setName("");
      setSlug("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Add Configuration</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Project</Label>
          <select name="projectId" required className="flex h-14 w-full rounded-2xl border border-border px-5">
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select name="type" required className="flex h-14 w-full rounded-2xl border border-border px-5">
            {CONFIGURATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>BHK</Label>
          <Input name="bhk" type="number" min="0" max="10" />
        </div>
        <div className="space-y-2">
          <Label>Min Price</Label>
          <Input name="priceMin" type="number" required />
        </div>
        <div className="space-y-2">
          <Label>Max Price</Label>
          <Input name="priceMax" type="number" required />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button type="submit" variant="accent" className="mt-4" disabled={isPending}>
        {isPending ? "Creating..." : "Create Configuration"}
      </Button>
    </form>
  );
}
