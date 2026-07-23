"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Copy,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadBlob,
  exportProjectIntelligenceExcel,
  exportProjectIntelligenceJson,
  openProjectIntelligencePdf,
  slugifyFilename,
} from "@/lib/project-intelligence/export-client";
import type { ProjectIntelligenceReport } from "@/types/project-intelligence";

type ExtractResponse = {
  success: boolean;
  data?: ProjectIntelligenceReport;
  error?: string;
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 text-sm text-muted">{children}</div>
    </div>
  );
}

function KeyValueGrid({ entries }: { entries: Array<[string, string | number | undefined]> }) {
  const rows = entries.filter(([, v]) => v !== undefined && v !== "");
  if (!rows.length) return <p className="text-muted">No data extracted.</p>;
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map(([key, value]) => (
        <div key={key} className="rounded-xl bg-muted/5 px-3 py-2">
          <dt className="text-xs uppercase tracking-wide text-muted">{key}</dt>
          <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProjectIntelligenceExtractor() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<ProjectIntelligenceReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const filenameBase = useMemo(() => {
    const name = report?.project.projectName ?? "project-intelligence";
    return slugifyFilename(name) || "project-intelligence";
  }, [report]);

  const runExtract = useCallback(async (refresh = false) => {
    if (!url.trim()) {
      setError("Enter a builder project URL");
      return;
    }
    setPending(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/project-intelligence/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), refresh }),
      });
      const json = (await response.json()) as ExtractResponse;
      if (!json.success || !json.data) {
        throw new Error(json.error ?? "Extraction failed");
      }
      setReport(json.data);
      setPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setPending(false);
    }
  }, [url]);

  async function handleSave() {
    if (!report) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/project-intelligence/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      const json = (await response.json()) as {
        success: boolean;
        data?: { id: string };
        error?: string;
      };
      if (!json.success || !json.data) {
        throw new Error(json.error ?? "Save failed");
      }
      setSaveMessage(`Saved to project_intelligence (${json.data.id})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!report) return;
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setSaveMessage("Copied JSON to clipboard");
  }

  function handleExportJson() {
    if (!report) return;
    downloadBlob(exportProjectIntelligenceJson(report), `${filenameBase}.json`);
  }

  function handleExportExcel() {
    if (!report) return;
    downloadBlob(exportProjectIntelligenceExcel(report), `${filenameBase}.xlsx`);
  }

  function handleExportPdf() {
    if (!report) return;
    openProjectIntelligencePdf(report);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanSearch className="h-5 w-5" />
            Project Intelligence Extractor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            Internal admin tool — crawl a builder project URL via Firecrawl and extract structured
            intelligence for possession timeline research and owner marketing prep.
          </p>

          <div className="space-y-1">
            <label className="text-sm text-muted" htmlFor="builder-project-url">
              Builder Project URL
            </label>
            <input
              id="builder-project-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.lodhagroup.com/projects/mumbai/worli/lodha-park/"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              disabled={pending}
            />
          </div>

          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {saveMessage && (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {saveMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runExtract(false)} disabled={pending || !url.trim()}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                "Extract"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => runExtract(true)}
              disabled={pending || !url.trim()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewOpen((v) => !v)}
              disabled={!report}
            >
              Preview
            </Button>
            <Button variant="outline" onClick={handleExportJson} disabled={!report}>
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportExcel} disabled={!report}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={!report}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!report}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={!report || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save to Database
                </>
              )}
            </Button>
          </div>

          {report && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Badge variant="outline">Status: {report.meta.crawlStatus}</Badge>
              <Badge variant="outline">
                {report.meta.pagesCrawled} pages crawled
              </Badge>
              <Badge variant="outline">{report.meta.imageCount} images</Badge>
              <Badge variant="outline">{report.meta.floorPlanCount} floor plans</Badge>
              <Badge variant="outline">
                Confidence {Math.round(report.meta.extractionConfidence * 100)}%
              </Badge>
              <Badge variant="outline">
                {formatDuration(report.meta.durationMs)}
              </Badge>
              <Badge variant="outline">
                {new Date(report.meta.extractedAt).toLocaleString("en-IN")}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {report && previewOpen && (
        <div className="space-y-4">
          <Section title="AI Summary">
            <p className="text-foreground">{report.aiSummary.projectOverview || "—"}</p>
            <ul className="mt-2 list-disc pl-5">
              {report.aiSummary.keyHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-2">
              <strong>Possession:</strong> {report.aiSummary.possessionStatus}
            </p>
            <p className="mt-1">
              <strong>Marketing readiness:</strong> {report.aiSummary.marketingReadiness}
            </p>
            <p className="mt-1">
              <strong>Recommended timeline:</strong>{" "}
              {report.aiSummary.recommendedOwnerMarketingTimeline}
            </p>
            {report.aiSummary.importantMissingInformation.length > 0 && (
              <p className="mt-2 text-amber-700">
                Missing: {report.aiSummary.importantMissingInformation.join(", ")}
              </p>
            )}
          </Section>

          <Section title="Project">
            <KeyValueGrid
              entries={[
                ["Project Name", report.project.projectName],
                ["Builder", report.project.builder],
                ["Address", report.project.address],
                ["Micro Location", report.project.microLocation],
                ["City", report.project.city],
                ["State", report.project.state],
                ["Coordinates", report.project.latitude && report.project.longitude ? `${report.project.latitude}, ${report.project.longitude}` : undefined],
                ["RERA", report.project.reraNumber],
                ["Status", report.project.projectStatus],
                ["Launch Date", report.project.launchDate],
                ["Expected Possession", report.project.expectedPossession],
                ["Revised Possession", report.project.revisedPossession],
                ["Current Phase", report.project.currentPhase],
                ["Construction Stage", report.project.constructionStage],
                ["Towers", report.project.towerCount],
                ["Floors", report.project.floorCount],
                ["Units", report.project.unitCount],
              ]}
            />
          </Section>

          <Section title="Possession Intelligence">
            <KeyValueGrid
              entries={[
                ["Expected Possession", report.possession.expectedPossession],
                ["Revised Possession", report.possession.revisedPossession],
                ["OC Status", report.possession.ocStatus],
                ["CC Status", report.possession.ccStatus],
                ["Completion %", report.possession.constructionCompletionPercent],
                ["AI Marketing Start", report.possession.aiEstimatedMarketingStartDate],
                ["AI Confidence", report.possession.aiConfidenceScore],
              ]}
            />
            {report.possession.towerWisePossession.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {report.possession.towerWisePossession.map((t) => (
                  <li key={t.tower}>
                    Tower {t.tower}: {t.possession ?? "—"}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Configurations (${report.configurations.length})`}>
            {report.configurations.length ? (
              <ul className="list-disc pl-5">
                {report.configurations.map((c) => (
                  <li key={`${c.configuration}-${c.carpetArea ?? ""}`}>
                    {c.configuration}
                    {c.carpetArea ? ` — ${c.carpetArea}` : ""}
                    {c.facing ? ` · ${c.facing} facing` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No configurations extracted.</p>
            )}
          </Section>

          <Section title={`Amenities (${report.amenities.length})`}>
            {report.amenities.length ? (
              <p>{report.amenities.join(" · ")}</p>
            ) : (
              <p>No amenities extracted.</p>
            )}
          </Section>

          <Section title={`Specifications (${report.specifications.length})`}>
            {report.specifications.map((s) => (
              <div key={s.category} className="mt-2">
                <strong>{s.category}:</strong> {s.details.join("; ")}
              </div>
            ))}
          </Section>

          <Section title={`Location POIs (${report.location.length})`}>
            {report.location.length ? (
              <ul className="list-disc pl-5">
                {report.location.map((p) => (
                  <li key={`${p.type}-${p.name}`}>
                    {p.type}: {p.name}
                    {p.distance ? ` (${p.distance})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No nearby POIs extracted.</p>
            )}
          </Section>

          <Section title={`Media (${report.media.length})`}>
            <p>{report.media.length} assets · {report.downloads.length} downloads</p>
            {report.downloads.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {report.downloads.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Project Updates">
            {report.projectUpdates.length ? (
              <ul className="list-disc pl-5">
                {report.projectUpdates.map((u, i) => (
                  <li key={`${u.title}-${i}`}>
                    [{u.category}] {u.summary ?? u.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No explicit updates found on crawled pages.</p>
            )}
          </Section>

          <Section title="Contact & Other">
            <KeyValueGrid
              entries={[
                ["Builder Website", report.contact.builderWebsite],
                ["Sales Office", report.contact.salesOffice],
                ["Phone", report.contact.phone],
                ["Email", report.contact.email],
              ]}
            />
          </Section>

          {(report.meta.warnings.length > 0 || report.meta.errors.length > 0) && (
            <Section title="Crawl Notes">
              {report.meta.errors.map((e) => (
                <p key={e} className="text-red-700">
                  {e}
                </p>
              ))}
              {report.meta.warnings.map((w) => (
                <p key={w} className="text-amber-700">
                  {w}
                </p>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
