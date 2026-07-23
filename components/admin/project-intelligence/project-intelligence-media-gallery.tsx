"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  downloadProjectImages,
  downloadSingleAsset,
} from "@/lib/project-intelligence/media-download-client";
import { normalizeProjectIntelligenceReport } from "@/lib/project-intelligence/report-normalizer";
import type { ProjectIntelligenceReport } from "@/types/project-intelligence";

export function ProjectIntelligenceMediaGallery({
  report,
  filenameBase,
}: {
  report: ProjectIntelligenceReport;
  filenameBase: string;
}) {
  const normalized = useMemo(() => normalizeProjectIntelligenceReport(report), [report]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!normalized.images.length) {
    return <p className="text-muted">No gallery images extracted.</p>;
  }

  const allSelected = selected.size === normalized.images.length;

  function toggleSelect(url: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(
      allSelected ? new Set() : new Set(normalized.images.map((image) => image.url))
    );
  }

  async function handleDownloadSelected() {
    if (!selected.size) return;
    setPending("selected");
    setError(null);
    try {
      await downloadProjectImages(report, filenameBase, [...selected]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setPending(null);
    }
  }

  async function handleDownloadOne(url: string, filename: string) {
    setPending(url);
    setError(null);
    try {
      await downloadSingleAsset(url, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allSelected ? "Clear Selection" : "Select All"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!selected.size || pending === "selected"}
          onClick={handleDownloadSelected}
        >
          {pending === "selected" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Selected ({selected.size})
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {normalized.images.map((image) => {
          const isSelected = selected.has(image.url);
          return (
            <div
              key={image.url}
              className={`overflow-hidden rounded-2xl border ${isSelected ? "border-accent" : "border-border"}`}
            >
              <div className="relative aspect-[4/3] bg-muted/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-2 p-3">
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(image.url)}
                  />
                  Select
                </label>
                <p className="truncate text-sm font-medium text-foreground">{image.filename}</p>
                <p className="text-xs text-muted">{image.type ?? "project"}</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending === image.url}
                  onClick={() => handleDownloadOne(image.url, image.filename)}
                >
                  {pending === image.url ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
