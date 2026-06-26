"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createNearbyPlaceAction } from "@/actions/admin/nearby-places";
import { POI_TYPES, POI_TYPE_LABELS } from "@/config/location-intelligence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

interface ProjectOption {
  _id: string;
  projectName: string;
  slug: string;
}

export function NearbyPlaceForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      entityType: "project" as const,
      entityId: String(formData.get("projectId")),
      type: String(formData.get("type")),
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      distanceLabel: String(formData.get("distanceLabel") || "") || undefined,
      travelTimeLabel: String(formData.get("travelTimeLabel") || "") || undefined,
      source: "manual" as const,
      confidence: "high" as const,
      isActive: true,
    };

    startTransition(async () => {
      const result = await createNearbyPlaceAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      event.currentTarget.reset();
      setName("");
      setSlug("");
      setError(null);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Add Nearby Place</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Project</Label>
          <select
            name="projectId"
            required
            className="flex h-14 w-full rounded-2xl border border-border px-5"
            defaultValue={projects[0]?._id ?? ""}
          >
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select name="type" required className="flex h-14 w-full rounded-2xl border border-border px-5">
            {POI_TYPES.map((type) => (
              <option key={type} value={type}>
                {POI_TYPE_LABELS[type]}
              </option>
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
          <Label>Distance</Label>
          <Input name="distanceLabel" placeholder="e.g. 1.2 km" />
        </div>
        <div className="space-y-2">
          <Label>Travel Time</Label>
          <Input name="travelTimeLabel" placeholder="e.g. 8 mins" />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button type="submit" variant="accent" className="mt-4" disabled={isPending}>
        {isPending ? "Creating..." : "Create Nearby Place"}
      </Button>
    </form>
  );
}
