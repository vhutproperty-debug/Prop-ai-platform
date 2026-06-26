"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  TrendingUp,
} from "lucide-react";
import {
  COMPLETION_CHECKLIST_LABELS,
  EXECUTIVE_TIMELINE_EVENT_TYPES,
} from "@/config/mission-control-v2";
import { cn } from "@/lib/utils";
import type {
  MissionControlExecutiveData,
  ReadinessLevel,
} from "@/types/mission-control";
import {
  EmptyState,
  KpiCard,
  MetricGrid,
  MiniBarChart,
  ReadinessBadge,
  ReadinessRing,
  SectionCard,
  StatusPill,
} from "./mission-control-widgets";
import {
  ResponsiveTableCard,
  ResponsiveTableRow,
  ResponsiveTableShell,
} from "@/components/ui/responsive-table";

const READINESS_STYLES: Record<
  ReadinessLevel,
  { bg: string; text: string; label: string }
> = {
  healthy: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    label: "Healthy",
  },
  attention: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-900",
    label: "Attention Required",
  },
  critical: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    label: "Critical",
  },
};

export function MissionControlExecutive({
  executive,
}: {
  executive: MissionControlExecutiveData;
}) {
  const [timelineFilter, setTimelineFilter] = useState("all");

  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "all") return executive.executiveTimeline;
    return executive.executiveTimeline.filter(
      (item) => item.eventType === timelineFilter
    );
  }, [executive.executiveTimeline, timelineFilter]);

  const readinessStyle = READINESS_STYLES[executive.platformReadiness.level];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <SectionCard
          title="Platform Readiness Score"
          description="Composite health across 8 operational dimensions"
          className={cn("border-2", readinessStyle.bg)}
        >
          <div className="flex flex-col items-center py-4">
            <ReadinessRing
              score={executive.platformReadiness.overall}
              level={executive.platformReadiness.level}
            />
            <ReadinessBadge
              level={executive.platformReadiness.level}
              className="mt-4"
            />
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(executive.platformReadiness.dimensions).map(
              ([label, dim]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm"
                >
                  <span className="truncate pr-2">{label}</span>
                  <span className="flex items-center gap-2 font-medium">
                    {dim.score}%
                    <ReadinessBadge level={dim.level} compact />
                  </span>
                </div>
              )
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Global Health Report"
          description={`Overall: ${executive.globalHealthReport.overall}% · ${READINESS_STYLES[executive.globalHealthReport.overallLevel].label}`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {executive.globalHealthReport.rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "rounded-2xl border p-4",
                  READINESS_STYLES[row.level].bg
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{row.label}</p>
                  <ReadinessBadge level={row.level} compact />
                </div>
                <p className={cn("mt-1 text-2xl font-semibold", READINESS_STYLES[row.level].text)}>
                  {row.score}%
                </p>
                <p className="mt-1 text-xs text-muted">{row.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Today&apos;s Business Snapshot</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Projects Imported Today" value={executive.todaySnapshot.projectsImportedToday} />
          <KpiCard label="Projects Published Today" value={executive.todaySnapshot.projectsPublishedToday} />
          <KpiCard label="Blogs Generated Today" value={executive.todaySnapshot.blogsGeneratedToday} />
          <KpiCard label="Leads Received Today" value={executive.todaySnapshot.leadsReceivedToday} />
          <KpiCard label="Builders Processed Today" value={executive.todaySnapshot.buildersProcessedToday} />
          <KpiCard label="Failed Jobs Today" value={executive.todaySnapshot.failedJobsToday} />
          <KpiCard label="Pending Reviews" value={executive.todaySnapshot.pendingReviews} />
          <KpiCard label="Pending Content Approvals" value={executive.todaySnapshot.pendingContentApprovals} />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="Action Required" description="High-priority operational queue">
          {executive.actionRequired.length === 0 ? (
            <EmptyState message="No pending actions — platform is in good shape." />
          ) : (
            <div className="space-y-3">
              {executive.actionRequired.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                    item.severity === "critical"
                      ? "border-red-200 bg-red-50/60"
                      : "border-amber-200 bg-amber-50/60"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p className="font-medium">{item.title}</p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{item.description}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {item.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Smart Notifications" description="Actionable alerts only">
          {executive.smartNotifications.length === 0 ? (
            <EmptyState message="No actionable notifications right now." />
          ) : (
            <div className="space-y-3">
              {executive.smartNotifications.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    alert.severity === "critical"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  )}
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted">{alert.description}</p>
                  {alert.href ? (
                    <Link href={alert.href} className="mt-2 inline-block text-sm text-accent hover:underline">
                      Take action →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Project Completion Score" description="Lowest completion projects first">
        {executive.projectCompletion.length === 0 ? (
          <EmptyState message="No active projects to score." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {executive.projectCompletion.map((project) => (
              <div key={project.projectId} className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={project.href} className="font-medium hover:text-accent">
                      {project.projectName}
                    </Link>
                    <p className="text-sm text-muted">{project.builderName}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-sm font-semibold",
                      project.completionPercent >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : project.completionPercent >= 50
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800"
                    )}
                  >
                    {project.completionPercent}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
                  {(Object.keys(COMPLETION_CHECKLIST_LABELS) as Array<keyof typeof COMPLETION_CHECKLIST_LABELS>).map((key) => {
                    const done = project.checklist[key];
                    return (
                      <span
                        key={key}
                        className={cn(
                          "flex items-center gap-1 rounded-lg px-2 py-1",
                          done ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                        )}
                      >
                        {done ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <Circle className="h-3 w-3 shrink-0" />}
                        {COMPLETION_CHECKLIST_LABELS[key]}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Builder Performance Dashboard" description="Ranked by reliability score">
        <ResponsiveTableShell
          mobile={executive.builderPerformance.map((builder) => (
            <ResponsiveTableCard key={builder.slug}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-muted">#{builder.rank}</span>
                  <Building2 className="h-4 w-4 text-muted" />
                  {builder.name}
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {builder.reliabilityScore}
                </span>
              </div>
              <ResponsiveTableRow label="Projects" value={builder.totalProjects} />
              <ResponsiveTableRow label="Published" value={builder.publishedProjects} />
              <ResponsiveTableRow label="Success Rate" value={`${builder.successRate}%`} />
              <ResponsiveTableRow label="Failed" value={builder.failedImports} />
              <ResponsiveTableRow
                label="Avg Time"
                value={
                  builder.averageProcessingTimeMs
                    ? `${Math.round(builder.averageProcessingTimeMs / 1000)}s`
                    : "—"
                }
              />
              <ResponsiveTableRow
                label="Last Import"
                value={
                  builder.lastImport
                    ? new Date(builder.lastImport).toLocaleDateString("en-IN")
                    : "—"
                }
              />
            </ResponsiveTableCard>
          ))}
          desktop={
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted">
                    <th className="px-4 pb-3">Rank</th>
                    <th className="px-4 pb-3">Builder</th>
                    <th className="px-4 pb-3">Projects</th>
                    <th className="px-4 pb-3">Published</th>
                    <th className="px-4 pb-3">Success Rate</th>
                    <th className="px-4 pb-3">Failed</th>
                    <th className="px-4 pb-3">Avg Time</th>
                    <th className="px-4 pb-3">Last Import</th>
                    <th className="px-4 pb-3">Reliability</th>
                  </tr>
                </thead>
                <tbody>
                  {executive.builderPerformance.map((builder) => (
                    <tr key={builder.slug} className="border-b border-border/60">
                      <td className="px-4 py-3 font-semibold">#{builder.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted" />
                          {builder.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">{builder.totalProjects}</td>
                      <td className="px-4 py-3">{builder.publishedProjects}</td>
                      <td className="px-4 py-3">{builder.successRate}%</td>
                      <td className="px-4 py-3">{builder.failedImports}</td>
                      <td className="px-4 py-3 text-muted">
                        {builder.averageProcessingTimeMs
                          ? `${Math.round(builder.averageProcessingTimeMs / 1000)}s`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {builder.lastImport
                          ? new Date(builder.lastImport).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-medium text-accent">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {builder.reliabilityScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        />
      </SectionCard>

      <div className="grid gap-8 xl:grid-cols-2">
        <SectionCard title="Locality Coverage">
          {executive.localityCoverage.byLocality.length === 0 ? (
            <EmptyState message="No localities configured yet." />
          ) : (
            <>
              <MiniBarChart
                items={executive.localityCoverage.byLocality.slice(0, 8).map((row) => ({
                  name: row.name,
                  count: row.projects,
                }))}
                labelKey="name"
                valueKey="count"
              />
              {executive.localityCoverage.missingLocalities.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Missing Localities (no projects)</p>
                  <div className="flex flex-wrap gap-2">
                    {executive.localityCoverage.missingLocalities.slice(0, 10).map((loc) => (
                      <span key={loc.slug} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900">
                        {loc.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Data Quality Center"
          description={`Data Quality Score: ${executive.dataQuality.score}%`}
        >
          <div className="mb-4 flex items-center gap-3">
            <ReadinessRing score={executive.dataQuality.score} level={executive.dataQuality.level} size="sm" />
            <ReadinessBadge level={executive.dataQuality.level} />
          </div>
          <MetricGrid
            items={[
              { label: "Duplicate Projects", value: executive.dataQuality.duplicateProjects },
              { label: "Missing Mandatory Fields", value: executive.dataQuality.missingMandatoryFields },
              { label: "Broken Images", value: executive.dataQuality.brokenImages },
              { label: "Missing Floor Plans", value: executive.dataQuality.missingFloorPlans },
              { label: "Missing Coordinates", value: executive.dataQuality.missingCoordinates },
              { label: "Missing SEO", value: executive.dataQuality.missingSeo },
              { label: "Missing Meta Descriptions", value: executive.dataQuality.missingMetaDescriptions },
              { label: "Invalid URLs", value: executive.dataQuality.invalidUrls },
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard title="Executive Timeline" description="Unified chronological feed">
        <div className="mb-4 flex flex-wrap gap-2">
          {EXECUTIVE_TIMELINE_EVENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setTimelineFilter(type.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                timelineFilter === type.id
                  ? "bg-accent text-white"
                  : "bg-background text-muted hover:text-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
        {filteredTimeline.length === 0 ? (
          <EmptyState message="No events for this filter." />
        ) : (
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {filteredTimeline.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-background/50 px-4 py-3">
                <StatusPill status={item.eventType === "error" ? "offline" : "online"} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{item.title}</p>
                    <time className="text-xs text-muted">
                      {new Date(item.timestamp).toLocaleString("en-IN")}
                    </time>
                  </div>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
