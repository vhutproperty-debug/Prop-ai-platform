import { cn } from "@/lib/utils";

export function ResponsiveTableShell({
  mobile,
  desktop,
  className,
}: {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="space-y-3 lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>
    </div>
  );
}

export function ResponsiveTableCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background/50 p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ResponsiveTableRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="min-w-0 text-right text-sm">{value}</span>
    </div>
  );
}
