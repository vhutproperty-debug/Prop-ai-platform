"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { cn } from "@/lib/utils";

export interface AdminColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
}

interface AdminDataTableProps<T extends { _id: string }> {
  rows: T[];
  columns: AdminColumn<T>[];
  onBulkAction?: (
    ids: string[],
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) => Promise<{ success: boolean }>;
  showFeaturedBulk?: boolean;
  emptyMessage?: string;
}

export function AdminDataTable<T extends { _id: string }>({
  rows,
  columns,
  onBulkAction,
  showFeaturedBulk = true,
  emptyMessage = "No records found.",
}: AdminDataTableProps<T>) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r._id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAction(
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    if (!onBulkAction) return;
    const result = await onBulkAction([...selected], action);
    if (result.success) router.refresh();
  }

  if (!rows.length) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {onBulkAction ? (
        <BulkActionsBar
          selectedCount={selected.size}
          onClear={() => setSelected(new Set())}
          onAction={handleBulkAction}
          showFeatured={showFeaturedBulk}
        />
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {onBulkAction ? (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              ) : null}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id}>
                {onBulkAction ? (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(row._id)}
                      onChange={() => toggleOne(row._id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                ) : null}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-foreground/5 text-muted"
      )}
    >
      {label ?? (active ? "Published" : "Draft")}
    </span>
  );
}
