"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAmenityAction } from "@/actions/admin/amenities";
import { AMENITY_CATEGORIES } from "@/config/model-constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils";

export function AmenityForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name")),
      slug: String(formData.get("slug")),
      category: String(formData.get("category")),
      description: String(formData.get("description") || "") || undefined,
      isActive: true,
    };

    startTransition(async () => {
      const result = await createAmenityAction(payload);
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
      <h3 className="mb-4 text-lg font-semibold">Add Amenity</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <Label>Category</Label>
          <select name="category" required className="flex h-14 w-full rounded-2xl border border-border px-5">
            {AMENITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input name="description" />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button type="submit" variant="accent" className="mt-4" disabled={isPending}>
        {isPending ? "Creating..." : "Create Amenity"}
      </Button>
    </form>
  );
}
