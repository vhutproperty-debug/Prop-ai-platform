"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProjectAction, updateProjectAction } from "@/actions/admin/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_STATUSES, type ProjectStatus } from "@/config/constants";
import { slugify } from "@/lib/utils";

interface Option {
  _id: string;
  name: string;
  slug?: string;
}

interface ProjectFormProps {
  builders: Option[];
  locations: Option[];
  initial?: {
    id?: string;
    builderId?: string;
    projectName?: string;
    slug?: string;
    location?: string;
    locationName?: string;
    microMarket?: string;
    status?: string;
    tagline?: string;
    description?: string;
    reraNumber?: string;
    brochure?: string;
    featured?: boolean;
    isActive?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    priceRange?: { min: number; max: number; currency?: string };
    possessionDate?: string;
  };
}

export function ProjectForm({ builders, locations, initial }: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(initial?.projectName ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const builderId = String(formData.get("builderId"));
    const builder = builders.find((b) => b._id === builderId);

    const payload = {
      builderId,
      builderName: builder?.name ?? "",
      projectName: String(formData.get("projectName")),
      slug: String(formData.get("slug")),
      location: String(formData.get("location")),
      locationName: String(formData.get("locationName") || "") || undefined,
      microMarket: String(formData.get("microMarket") || "") || undefined,
      status: String(formData.get("status")) as ProjectStatus,
      tagline: String(formData.get("tagline") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      reraNumber: String(formData.get("reraNumber") || "") || undefined,
      brochure: String(formData.get("brochure") || "") || undefined,
      seoTitle: String(formData.get("seoTitle") || "") || undefined,
      seoDescription: String(formData.get("seoDescription") || "") || undefined,
      featured: formData.get("featured") === "on",
      isActive: formData.get("isActive") === "on",
      priceRange: {
        min: Number(formData.get("priceMin")),
        max: Number(formData.get("priceMax")),
        currency: "INR",
      },
      possessionDate: formData.get("possessionDate")
        ? new Date(String(formData.get("possessionDate")))
        : undefined,
      configurations: [],
      amenities: [],
      gallery: [],
      faqs: [],
    };

    startTransition(async () => {
      const result = initial?.id
        ? await updateProjectAction({ id: initial.id, ...payload })
        : await createProjectAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/admin/projects");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-border bg-white p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            name="projectName"
            required
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (!initial?.id) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="builderId">Builder</Label>
          <select
            id="builderId"
            name="builderId"
            required
            defaultValue={initial?.builderId}
            className="flex h-14 w-full rounded-2xl border border-border bg-white/80 px-5"
          >
            <option value="">Select builder</option>
            {builders.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <select
            id="location"
            name="location"
            required
            defaultValue={initial?.location}
            className="flex h-14 w-full rounded-2xl border border-border bg-white/80 px-5"
          >
            <option value="">Select location</option>
            {locations.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "ongoing"}
            className="flex h-14 w-full rounded-2xl border border-border bg-white/80 px-5"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceMin">Min Price (INR)</Label>
          <Input id="priceMin" name="priceMin" type="number" required defaultValue={initial?.priceRange?.min} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceMax">Max Price (INR)</Label>
          <Input id="priceMax" name="priceMax" type="number" required defaultValue={initial?.priceRange?.max} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reraNumber">RERA Number</Label>
          <Input id="reraNumber" name="reraNumber" defaultValue={initial?.reraNumber} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="possessionDate">Possession Date</Label>
          <Input
            id="possessionDate"
            name="possessionDate"
            type="date"
            defaultValue={initial?.possessionDate?.slice(0, 10)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={initial?.tagline} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={initial?.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brochure">Brochure URL</Label>
        <Input id="brochure" name="brochure" type="url" defaultValue={initial?.brochure} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Input id="seoDescription" name="seoDescription" defaultValue={initial?.seoDescription} />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured ?? false} />
          Featured
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? "Saving..." : initial?.id ? "Update Project" : "Create Project"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
