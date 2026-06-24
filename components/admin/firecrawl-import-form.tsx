"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runFirecrawlImportAction, runAllFirecrawlImportsAction } from "@/actions/firecrawl-imports";
import { SUPPORTED_BUILDERS } from "@/config/builders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FirecrawlImportForm() {
  const router = useRouter();
  const [builderSlug, setBuilderSlug] = useState(SUPPORTED_BUILDERS[0]?.slug ?? "");
  const [maxProjects, setMaxProjects] = useState(50);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setPending(true);
    setError(null);
    const result = await runFirecrawlImportAction({ builderSlug, maxProjects });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/admin/imports/${result.data.jobId}`);
    router.refresh();
  }

  async function handleImportAll() {
    setPending(true);
    setError(null);
    const result = await runAllFirecrawlImportsAction(30);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firecrawl Builder Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">
          Crawl builder websites via Firecrawl, extract structured project data, and stage for review.
          Requires FIRECRAWL_API_KEY.
        </p>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-sm text-muted" htmlFor="builder">
              Builder
            </label>
            <select
              id="builder"
              value={builderSlug}
              onChange={(e) => setBuilderSlug(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              disabled={pending}
            >
              {SUPPORTED_BUILDERS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted" htmlFor="maxProjects">
              Max projects
            </label>
            <input
              id="maxProjects"
              type="number"
              min={1}
              max={200}
              value={maxProjects}
              onChange={(e) => setMaxProjects(parseInt(e.target.value, 10))}
              className="w-24 rounded-xl border border-border bg-white px-3 py-2 text-sm"
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleImport} disabled={pending}>
            {pending ? "Importing…" : "Start Import"}
          </Button>
          <Button variant="outline" onClick={handleImportAll} disabled={pending}>
            Import All Builders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
