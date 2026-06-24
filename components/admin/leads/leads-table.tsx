"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  bulkLeadAction,
  deleteAdminLeadAction,
  updateAdminLeadAction,
} from "@/actions/admin/leads";
import {
  AdminDataTable,
  type AdminColumn,
} from "@/components/admin/admin-data-table";
import {
  getScoreBadgeClass,
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/labels";
import { LEAD_SCORES, LEAD_STATUSES, type LeadScore, type LeadStatus } from "@/config/constants";
import type { LeadListItem } from "@/types/lead";
import { cn } from "@/lib/utils";

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rows = leads.map((lead) => ({ ...lead, _id: lead._id }));

  const columns: AdminColumn<LeadListItem & { _id: string }>[] = [
    {
      key: "name",
      header: "Lead",
      render: (row) => (
        <div>
          <Link href={`/admin/leads/${row._id}`} className="font-medium hover:text-accent">
            {row.name}
          </Link>
          <p className="text-xs text-muted">{row.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (row) => row.phone },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <select
          value={row.status}
          disabled={pendingId === row._id}
          onChange={(e) => {
            setPendingId(row._id);
            startTransition(async () => {
              await updateAdminLeadAction({
                id: row._id,
                status: e.target.value as LeadStatus,
              });
              setPendingId(null);
              router.refresh();
            });
          }}
          className="rounded-full border border-border px-2 py-1 text-xs"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "score",
      header: "Score",
      render: (row) => (
        <select
          value={row.score}
          disabled={pendingId === row._id}
          onChange={(e) => {
            setPendingId(row._id);
            startTransition(async () => {
              await updateAdminLeadAction({
                id: row._id,
                score: e.target.value as LeadScore,
              });
              setPendingId(null);
              router.refresh();
            });
          }}
          className={cn(
            "rounded-full border border-border px-2 py-1 text-xs",
            getScoreBadgeClass(row.score)
          )}
        >
          {LEAD_SCORES.map((score) => (
            <option key={score} value={score}>
              {LEAD_SCORE_LABELS[score]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (row) => LEAD_SOURCE_LABELS[row.source],
    },
    {
      key: "project",
      header: "Project",
      render: (row) => row.projectSlug ?? "—",
    },
    {
      key: "assigned",
      header: "Assigned",
      render: (row) => row.assignedToName ?? "—",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className="text-sm text-muted hover:text-foreground"
          onClick={() => {
            setPendingId(row._id);
            startTransition(async () => {
              await deleteAdminLeadAction(row._id);
              setPendingId(null);
              router.refresh();
            });
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={rows}
      columns={columns}
      showFeaturedBulk={false}
      onBulkAction={async (ids, action) => {
        if (action === "publish") {
          const result = await bulkLeadAction({ ids, action: "set_status", status: "contacted" });
          return { success: result.success };
        }
        if (action === "unpublish") {
          const result = await bulkLeadAction({ ids, action: "set_status", status: "lost" });
          return { success: result.success };
        }
        if (action === "delete") {
          const result = await bulkLeadAction({ ids, action: "delete" });
          return { success: result.success };
        }
        return { success: false };
      }}
      emptyMessage="No leads found."
    />
  );
}
