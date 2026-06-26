"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  Loader2,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { MISSION_CONTROL_REFRESH_MS } from "@/config/mission-control";
import { cn } from "@/lib/utils";
import type {
  MissionControlDashboardData,
  MissionControlFilter,
  MissionControlSearchResult,
} from "@/types/mission-control";
import {
  EmptyState,
  KpiCard,
  MetricGrid,
  MiniBarChart,
  SectionCard,
  StatusPill,
} from "./mission-control-widgets";
import {
  ResponsiveTableCard,
  ResponsiveTableRow,
  ResponsiveTableShell,
} from "@/components/ui/responsive-table";
import { MissionControlExecutive } from "./mission-control-executive";

const QUICK_ACTIONS = [
  { label: "Import Project", href: "/admin/imports" },
  { label: "Import Builder", href: "/admin/builders/new" },
  { label: "Review Imports", href: "/admin/imports/review" },
  { label: "Publish Projects", href: "/admin/projects" },
  { label: "Generate Blogs", href: "/admin/content/generate" },
  { label: "Manage Builders", href: "/admin/builders" },
  { label: "Manage Localities", href: "/admin/projects" },
  { label: "Manage Nearby Places", href: "/admin/nearby-places" },
  { label: "Open Leads", href: "/admin/leads" },
  { label: "Run Verification", href: "/admin/system/database" },
  { label: "View Logs", href: "/admin/imports" },
];

function PipelineFlow({
  stages,
  currentStage,
}: {
  stages: Array<{ id: string; label: string }>;
  currentStage: string;
}) {
  const currentIdx = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex flex-col items-center gap-1 py-2 text-xs">
      {stages.map((stage, idx) => {
        const active = idx === currentIdx;
        const done = currentIdx > idx;
        return (
          <div key={stage.id} className="flex flex-col items-center">
            <span
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                active && "bg-accent text-white",
                done && !active && "bg-emerald-100 text-emerald-800",
                !active && !done && "bg-background text-muted"
              )}
            >
              {stage.label}
            </span>
            {idx < stages.length - 1 ? (
              <span className="my-0.5 text-muted">↓</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function MissionControlDashboard() {
  const [data, setData] = useState<MissionControlDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MissionControlFilter>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MissionControlSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.builderSlug) params.set("builderSlug", filters.builderSlug);
    if (filters.localitySlug) params.set("localitySlug", filters.localitySlug);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [filters]);

  const loadDashboard = useCallback(
    async (silent = false, bypassCache = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const refreshParam = bypassCache
          ? `${queryString ? "&" : "?"}_refresh=1`
          : "";
        const res = await fetch(
          `/api/admin/mission-control${queryString}${refreshParam}`,
          {
            credentials: "include",
          }
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to load dashboard");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryString]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const timer = setInterval(() => void loadDashboard(true), MISSION_CONTROL_REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) return;

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/mission-control/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success) setSearchResults(json.data.results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const visibleSearchResults =
    searchQuery.trim().length >= 2 ? searchResults : [];

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard(false, true)}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const kpiItems = [
    { label: "Total Builders", value: data.kpis.totalBuilders },
    { label: "Total Projects", value: data.kpis.totalProjects },
    { label: "Total Localities", value: data.kpis.totalLocalities },
    { label: "Landing Pages", value: data.kpis.totalLandingPages },
    { label: "Blog Articles", value: data.kpis.totalBlogArticles },
    { label: "Nearby Places", value: data.kpis.totalNearbyPlaces },
    { label: "Total Images", value: data.kpis.totalImages },
    { label: "Total Leads", value: data.kpis.totalLeads },
    { label: "Active Users", value: data.kpis.activeUsers },
    { label: "Today's Imports", value: data.kpis.todaysImports },
    { label: "Pending Reviews", value: data.kpis.pendingReviews },
    { label: "Failed Jobs", value: data.kpis.failedJobs },
  ];

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-foreground via-foreground to-accent/80 p-5 text-white shadow-lg sm:rounded-[2.5rem] sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
              <Zap className="h-4 w-4" />
              Administrator Command Center
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Mission Control
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Executive operational command center — readiness scores, action queues, and
              real-time platform intelligence.
            </p>
            <p className="mt-3 text-xs text-white/50">
              Last updated {new Date(data.generatedAt).toLocaleString("en-IN")}
              {refreshing ? " · Refreshing…" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard(true, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25 disabled:opacity-60 lg:self-auto"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Global search + filters */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search builders, projects, blogs, localities, leads, users…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-accent"
          />
          {searchOpen && visibleSearchResults.length > 0 ? (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
              {visibleSearchResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-background"
                >
                  <div>
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle ? (
                      <p className="text-xs text-muted">{result.subtitle}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs capitalize text-muted">
                    {result.type}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Builder slug"
            value={filters.builderSlug ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, builderSlug: e.target.value || undefined }))
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          <input
            placeholder="Locality slug"
            value={filters.localitySlug ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, localitySlug: e.target.value || undefined }))
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          <select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value || undefined }))
            }
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="published">Published</option>
            <option value="staged">Staged</option>
          </select>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:border-accent hover:text-accent"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>

      <MissionControlExecutive executive={data.executive} />

      {/* Catalog Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Catalog Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpiItems.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 ? (
        <SectionCard title="Notifications & Alerts" description="Issues requiring attention">
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3",
                  alert.severity === "critical" && "border-red-200 bg-red-50",
                  alert.severity === "warning" && "border-amber-200 bg-amber-50",
                  alert.severity === "info" && "border-border bg-background/60"
                )}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted">{alert.description}</p>
                </div>
                {alert.href ? (
                  <Link href={alert.href} className="text-sm text-accent hover:underline">
                    View
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Platform health */}
      <SectionCard title="Platform Health" description="Live subsystem status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {data.platformHealth.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-border bg-background/50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{service.label}</p>
                <StatusPill status={service.status} />
              </div>
              <p className="mt-2 text-xs text-muted">{service.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Import engine */}
        <SectionCard title="Import Engine">
          <MetricGrid
            items={[
              { label: "Builders Configured", value: data.importEngine.buildersConfigured },
              { label: "Active Builders", value: data.importEngine.activeBuilders },
              { label: "Scheduled Imports", value: data.importEngine.scheduledImports },
              { label: "Imports Today", value: data.importEngine.importsToday },
              { label: "Imports This Week", value: data.importEngine.importsThisWeek },
              { label: "Successful", value: data.importEngine.successfulImports },
              { label: "Failed", value: data.importEngine.failedImports },
              { label: "Duplicates", value: data.importEngine.duplicateProjects },
              { label: "Pending Reviews", value: data.importEngine.pendingReviews },
              { label: "Published", value: data.importEngine.publishedProjects },
              { label: "Success Rate", value: `${data.importEngine.successRate}%` },
              { label: "Failure Rate", value: `${data.importEngine.failureRate}%` },
            ]}
          />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium">Imports per Day</h3>
              <MiniBarChart
                items={data.importEngine.importsPerDay.map((d) => ({
                  date: d.date,
                  count: d.count,
                }))}
                labelKey="date"
                valueKey="count"
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Imports per Builder</h3>
              <MiniBarChart
                items={data.importEngine.importsPerBuilder.map((d) => ({
                  builder: d.builder,
                  count: d.count,
                }))}
                labelKey="builder"
                valueKey="count"
              />
            </div>
          </div>
        </SectionCard>

        {/* Live pipeline */}
        <SectionCard title="Live Import Pipeline">
          {data.livePipeline.length === 0 ? (
            <EmptyState message="No imports running. Start one from Quick Actions." />
          ) : (
            <div className="space-y-6">
              {data.livePipeline.map((item) => (
                <div
                  key={item.jobId}
                  className="grid gap-4 rounded-2xl border border-border bg-background/40 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-medium">{item.project}</p>
                    <p className="text-sm text-muted">{item.builder}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{item.currentStage}</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <PipelineFlow
                      stages={data.pipelineStages}
                      currentStage={item.currentStageId}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Builder management */}
      <SectionCard title="Builder Management">
        {data.builders.length === 0 ? (
          <EmptyState message="No builders configured yet." />
        ) : (
          <ResponsiveTableShell
            mobile={data.builders.map((builder) => (
              <ResponsiveTableCard key={builder.slug}>
                <div className="mb-3 flex items-center gap-3">
                  {builder.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={builder.logoUrl}
                      alt=""
                      className="h-8 w-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                      <Building2 className="h-4 w-4 text-muted" />
                    </div>
                  )}
                  <span className="font-medium">{builder.name}</span>
                </div>
                <ResponsiveTableRow label="Projects" value={builder.projects} />
                <ResponsiveTableRow
                  label="Last Import"
                  value={
                    builder.lastImport
                      ? new Date(builder.lastImport).toLocaleDateString("en-IN")
                      : "—"
                  }
                />
                <ResponsiveTableRow label="Success Rate" value={`${builder.successRate}%`} />
                <ResponsiveTableRow
                  label="Avg Time"
                  value={
                    builder.averageImportTimeMs
                      ? `${Math.round(builder.averageImportTimeMs / 1000)}s`
                      : "—"
                  }
                />
                <ResponsiveTableRow label="Status" value={<StatusPill status={builder.importStatus} />} />
              </ResponsiveTableCard>
            ))}
            desktop={
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted">
                      <th className="px-4 pb-3">Builder</th>
                      <th className="px-4 pb-3">Projects</th>
                      <th className="px-4 pb-3">Last Import</th>
                      <th className="px-4 pb-3">Success Rate</th>
                      <th className="px-4 pb-3">Avg Time</th>
                      <th className="px-4 pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.builders.map((builder) => (
                      <tr key={builder.slug} className="border-b border-border/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {builder.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={builder.logoUrl}
                                alt=""
                                className="h-8 w-8 rounded-lg object-contain"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                                <Building2 className="h-4 w-4 text-muted" />
                              </div>
                            )}
                            <span className="font-medium">{builder.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{builder.projects}</td>
                        <td className="px-4 py-3 text-muted">
                          {builder.lastImport
                            ? new Date(builder.lastImport).toLocaleDateString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{builder.successRate}%</td>
                        <td className="px-4 py-3 text-muted">
                          {builder.averageImportTimeMs
                            ? `${Math.round(builder.averageImportTimeMs / 1000)}s`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={builder.importStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          />
        )}
      </SectionCard>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Project factory */}
        <SectionCard title="Project Factory">
          <MetricGrid
            items={[
              { label: "Imported", value: data.projectFactory.projectsImported },
              { label: "Landing Pages", value: data.projectFactory.landingPagesGenerated },
              { label: "Published", value: data.projectFactory.publishedProjects },
              { label: "Drafts", value: data.projectFactory.draftProjects },
              { label: "Archived", value: data.projectFactory.archivedProjects },
            ]}
          />
          <h3 className="mb-3 mt-6 text-sm font-medium">Missing Information</h3>
          <MetricGrid
            items={[
              { label: "Images", value: data.projectFactory.missing.images },
              { label: "Floor Plans", value: data.projectFactory.missing.floorPlans },
              { label: "Nearby Places", value: data.projectFactory.missing.nearbyPlaces },
              { label: "Pricing", value: data.projectFactory.missing.pricing },
              { label: "Amenities", value: data.projectFactory.missing.amenities },
              { label: "Configurations", value: data.projectFactory.missing.configurations },
            ]}
          />
        </SectionCard>

        {/* Content factory */}
        <SectionCard title="Content Factory">
          <MetricGrid
            items={[
              { label: "Generated", value: data.contentFactory.articlesGenerated },
              { label: "Published", value: data.contentFactory.published },
              { label: "Drafts", value: data.contentFactory.drafts },
              { label: "Scheduled", value: data.contentFactory.scheduled },
              { label: "AI Jobs", value: data.contentFactory.aiJobs },
              { label: "Failed Jobs", value: data.contentFactory.failedJobs },
            ]}
          />
          <h3 className="mb-3 mt-6 text-sm font-medium">Breakdown</h3>
          <MetricGrid
            items={Object.entries(data.contentFactory.breakdown).map(([label, value]) => ({
              label,
              value,
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="SEO Center">
          <MetricGrid
            items={[
              { label: "Meta Titles", value: data.seoCenter.metaTitles },
              { label: "Meta Descriptions", value: data.seoCenter.metaDescriptions },
              { label: "Schema Generated", value: data.seoCenter.schemaGenerated },
              { label: "Sitemap Entries", value: data.seoCenter.sitemapEntries },
              { label: "Canonicals", value: data.seoCenter.canonicals },
              { label: "Internal Links", value: data.seoCenter.internalLinks },
              { label: "Missing SEO", value: data.seoCenter.missingSeo },
              { label: "Redirect Issues", value: data.seoCenter.redirectIssues },
            ]}
          />
        </SectionCard>

        <SectionCard title="Location Intelligence">
          <MetricGrid
            items={Object.entries(data.locationIntelligence.byType).map(([label, value]) => ({
              label,
              value,
            }))}
          />
          <p className="mt-4 text-sm text-muted">
            Projects missing POI data:{" "}
            <span className="font-semibold text-foreground">
              {data.locationIntelligence.projectsMissingPoi}
            </span>
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="Media Center">
          <MetricGrid
            items={[
              { label: "Images", value: data.mediaCenter.images },
              { label: "Floor Plans", value: data.mediaCenter.floorPlans },
              { label: "Brochures", value: data.mediaCenter.brochures },
              { label: "Videos", value: data.mediaCenter.videos },
              { label: "Virtual Tours", value: data.mediaCenter.virtualTours },
              {
                label: "Projects Missing Media",
                value: data.mediaCenter.projectsMissingMedia,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Search Intelligence">
          <MetricGrid
            items={[
              { label: "Indexed Projects", value: data.searchIntelligence.indexedProjects },
              { label: "Indexed Blogs", value: data.searchIntelligence.indexedBlogs },
              {
                label: "Embeddings Generated",
                value: data.searchIntelligence.embeddingsGenerated,
              },
              {
                label: "Waiting for Indexing",
                value: data.searchIntelligence.projectsWaitingForIndexing,
              },
              {
                label: "Search Queries Today",
                value: data.searchIntelligence.searchQueriesToday,
              },
            ]}
          />
          {data.searchIntelligence.topSearches.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Top Searches</h3>
              <div className="flex flex-wrap gap-2">
                {data.searchIntelligence.topSearches.map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-background px-3 py-1 text-xs"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Search analytics coming soon.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="AI Center">
          <MetricGrid
            items={[
              { label: "AI Jobs", value: data.aiCenter.aiJobs },
              { label: "Content Generation", value: data.aiCenter.contentGeneration },
              { label: "Queue Depth", value: data.aiCenter.queueDepth },
            ]}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["Recommendation Engine", data.aiCenter.recommendationEngine],
                ["Embeddings", data.aiCenter.embeddings],
                ["Semantic Search", data.aiCenter.semanticSearch],
                ["AI Assistant", data.aiCenter.aiAssistant],
                ["Broker Copilot", data.aiCenter.brokerCopilot],
              ] as const
            ).map(([label, status]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2 text-sm"
              >
                <span>{label}</span>
                <StatusPill status={status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="CRM & Leads">
          <MetricGrid
            items={[
              { label: "Leads Today", value: data.crm.leadsToday },
              { label: "Leads This Week", value: data.crm.leadsThisWeek },
              { label: "Leads This Month", value: data.crm.leadsThisMonth },
              { label: "Conversion Rate", value: `${data.crm.conversionRate}%` },
              { label: "Site Visit Requests", value: data.crm.siteVisitRequests },
              { label: "WhatsApp Enquiries", value: data.crm.whatsappEnquiries },
            ]}
          />
          {data.crm.projectWiseLeads.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium">Top Projects by Leads</h3>
              <MiniBarChart
                items={data.crm.projectWiseLeads.map((p) => ({
                  name: p.name,
                  count: p.count,
                }))}
                labelKey="name"
                valueKey="count"
              />
            </div>
          ) : null}
        </SectionCard>
      </div>

      {/* Revenue placeholder */}
      <SectionCard
        title="Revenue Dashboard"
        description={
          data.revenue.isPlaceholder
            ? "Revenue tracking module — placeholder until billing is integrated"
            : undefined
        }
      >
        {data.revenue.isPlaceholder ? (
          <EmptyState message="Revenue metrics will appear here once premium listings and deal tracking are enabled." />
        ) : (
          <MetricGrid
            items={[
              { label: "Active Listings", value: data.revenue.activeListings },
              { label: "Premium Listings", value: data.revenue.premiumListings },
              { label: "Lead Value", value: data.revenue.leadValue },
              {
                label: "Commission Pipeline",
                value: data.revenue.estimatedCommissionPipeline,
              },
              { label: "Closed Deals", value: data.revenue.closedDeals },
              { label: "Monthly Revenue", value: data.revenue.monthlyRevenue },
            ]}
          />
        )}
      </SectionCard>

      {/* Activity timeline */}
      <SectionCard title="Activity Timeline">
        {data.activity.length === 0 ? (
          <EmptyState message="No recent activity logged yet." />
        ) : (
          <div className="space-y-4">
            {data.activity.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted">
                  <Activity className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1 border-b border-border pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <time className="text-xs text-muted">
                      {new Date(item.timestamp).toLocaleString("en-IN")}
                    </time>
                  </div>
                  <p className="text-sm text-muted">{item.description}</p>
                  <span className="mt-1 inline-block text-xs capitalize text-muted">
                    {item.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
