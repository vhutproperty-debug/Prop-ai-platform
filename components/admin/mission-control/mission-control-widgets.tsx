"use client";

import { cn } from "@/lib/utils";
import type { ReadinessLevel, ServiceHealthStatus } from "@/types/mission-control";

const READINESS_COLORS: Record<ReadinessLevel, string> = {
  healthy: "text-emerald-500",
  attention: "text-amber-500",
  critical: "text-red-500",
};

const READINESS_BADGE: Record<ReadinessLevel, string> = {
  healthy: "bg-emerald-100 text-emerald-800 border-emerald-200",
  attention: "bg-amber-100 text-amber-900 border-amber-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const READINESS_LABELS: Record<ReadinessLevel, string> = {
  healthy: "Healthy",
  attention: "Attention",
  critical: "Critical",
};

export function ReadinessRing({
  score,
  level,
  size = "lg",
}: {
  score: number;
  level: ReadinessLevel;
  size?: "sm" | "lg";
}) {
  const dimension = size === "sm" ? 72 : 140;
  const stroke = size === "sm" ? 6 : 10;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-background"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={READINESS_COLORS[level]}
        />
      </svg>
      <div className="absolute text-center">
        <p className={cn("font-semibold", size === "sm" ? "text-lg" : "text-3xl")}>
          {score}%
        </p>
      </div>
    </div>
  );
}

export function ReadinessBadge({
  level,
  compact,
  className,
}: {
  level: ReadinessLevel;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        READINESS_BADGE[level],
        compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {READINESS_LABELS[level]}
    </span>
  );
}

export function StatusPill({ status }: { status: ServiceHealthStatus }) {
  const styles: Record<ServiceHealthStatus, string> = {
    online: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-900 border-amber-200",
    offline: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<ServiceHealthStatus, string> = {
    online: "Online",
    warning: "Warning",
    offline: "Offline",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[2rem] border border-border bg-white p-4 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-8 text-center text-sm text-muted">
      {message}
    </div>
  );
}

export function MiniBarChart({
  items,
  labelKey,
  valueKey,
}: {
  items: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
}) {
  if (!items.length) return <EmptyState message="No data yet for this chart." />;

  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const label = String(item[labelKey]);
        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate pr-3">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.max(8, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: number | string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">{item.label}</p>
          <p className="mt-1 text-lg font-semibold">
            {typeof item.value === "number"
              ? item.value.toLocaleString("en-IN")
              : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
