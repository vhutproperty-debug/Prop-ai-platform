"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBuilderAction, updateBuilderAction } from "@/actions/admin/builders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";

interface BuilderFormProps {
  initial?: {
    id?: string;
    name?: string;
    slug?: string;
    logoUrl?: string;
    tagline?: string;
    description?: string;
    website?: string;
    establishedYear?: number;
    rating?: number;
    headquarters?: string;
    isActive?: boolean;
    isFeatured?: boolean;
  };
}

export function BuilderForm({ initial }: BuilderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      logoUrl: String(formData.get("logoUrl") || "") || undefined,
      tagline: String(formData.get("tagline") || "") || undefined,
      description: String(formData.get("description") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      establishedYear: formData.get("establishedYear")
        ? Number(formData.get("establishedYear"))
        : undefined,
      rating: formData.get("rating") ? Number(formData.get("rating")) : undefined,
      headquarters: String(formData.get("headquarters") || "") || undefined,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
    };

    startTransition(async () => {
      const result = initial?.id
        ? await updateBuilderAction({ id: initial.id, ...payload })
        : await createBuilderAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/admin/builders");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-border bg-white p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initial?.id) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" name="logoUrl" type="url" defaultValue={initial?.logoUrl} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={initial?.tagline} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={initial?.description} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" defaultValue={initial?.website} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="headquarters">Headquarters</Label>
          <Input id="headquarters" name="headquarters" defaultValue={initial?.headquarters} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="establishedYear">Established</Label>
          <Input id="establishedYear" name="establishedYear" type="number" defaultValue={initial?.establishedYear} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <Input id="rating" name="rating" type="number" step="0.1" min="0" max="5" defaultValue={initial?.rating} />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured ?? false} />
          Featured
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? "Saving..." : initial?.id ? "Update Builder" : "Create Builder"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
