"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateContentAction } from "@/actions/admin/content";
import { CONTENT_TYPE_LABELS, DEFAULT_GENERATION_CONTENT_TYPES } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectOption {
  _id: string;
  name: string;
}

export function ContentGenerateForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?._id ?? "");
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(
    DEFAULT_GENERATION_CONTENT_TYPES
  );
  const [quantityPerType, setQuantityPerType] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: ContentType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleGenerate() {
    if (!projectId || !selectedTypes.length) return;
    setPending(true);
    setError(null);

    const result = await generateContentAction({
      projectId,
      contentTypes: selectedTypes,
      quantityPerType,
    });

    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/admin/content/review");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Content Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Select a project and content types. The engine researches structured data first, builds a knowledge pack, then generates articles for review.
        </p>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm text-muted" htmlFor="project">
            Project
          </label>
          <select
            id="project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full max-w-md rounded-xl border border-border bg-white px-3 py-2 text-sm"
            disabled={pending}
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted">Content types</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-full px-3 py-1 text-xs ${
                  selectedTypes.includes(type)
                    ? "bg-foreground text-background"
                    : "border border-border text-muted"
                }`}
                disabled={pending}
              >
                {CONTENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted" htmlFor="qty">
            Quantity per type
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={5}
            value={quantityPerType}
            onChange={(e) => setQuantityPerType(parseInt(e.target.value, 10))}
            className="w-24 rounded-xl border border-border px-3 py-2 text-sm"
            disabled={pending}
          />
        </div>

        <Button onClick={handleGenerate} disabled={pending || !projectId}>
          {pending ? "Generating…" : "Generate Articles"}
        </Button>
      </CardContent>
    </Card>
  );
}
