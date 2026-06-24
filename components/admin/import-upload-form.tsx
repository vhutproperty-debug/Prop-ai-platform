"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runImportAction } from "@/actions/imports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ImportSource } from "@/config/ingestion";

const SOURCE_OPTIONS: { value: ImportSource; label: string }[] = [
  { value: "manual", label: "Manual JSON Import" },
  { value: "builder_website", label: "Builder Website (Structured Facts)" },
  { value: "csv", label: "CSV Import" },
  { value: "pdf_brochure", label: "PDF Brochure (Factual Extraction)" },
];

export function ImportUploadForm() {
  const router = useRouter();
  const [source, setSource] = useState<ImportSource>("manual");
  const [payload, setPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(payload);
      const result = await runImportAction({ source, payload: parsed });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/admin/imports/${result.data.jobId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON payload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Import</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source Type</Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value as ImportSource)}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payload">Structured Payload (JSON)</Label>
            <Textarea
              id="payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder='{"project": {...}}'
              className="min-h-48 font-mono text-xs"
              required
            />
            <p className="text-xs text-muted">
              Copyright-safe: only structured factual data. No marketing copy from automated scraping.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Run Import Pipeline"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
