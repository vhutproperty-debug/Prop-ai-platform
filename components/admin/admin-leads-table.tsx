"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEAD_STATUSES } from "@/config/constants";
import {
  bulkLeadAction,
  deleteAdminLeadAction,
  updateAdminLeadAction,
} from "@/actions/admin/leads";
import {
  AdminDataTable,
  type AdminColumn,
} from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui/button";

interface LeadRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
}

export function AdminLeadsTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const columns: AdminColumn<LeadRow>[] = [
    { key: "name", header: "Name", render: (row) => <span className="font-medium">{row.name}</span> },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div>
          <div>{row.email}</div>
          <div className="text-xs text-muted">{row.phone}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <select
          value={row.status}
          disabled={pendingId === row._id}
          onChange={async (e) => {
            setPendingId(row._id);
            await updateAdminLeadAction({
              id: row._id,
              status: e.target.value as (typeof LEAD_STATUSES)[number],
            });
            setPendingId(null);
            router.refresh();
          }}
          className="rounded-full border border-border px-3 py-1 text-xs"
        >
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
    { key: "source", header: "Source", render: (row) => row.source },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={pendingId === row._id}
          onClick={async () => {
            setPendingId(row._id);
            await deleteAdminLeadAction(row._id);
            setPendingId(null);
            router.refresh();
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={leads}
      columns={columns}
      showFeaturedBulk={false}
      onBulkAction={async (ids, action) => {
        const result = await bulkLeadAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No leads yet."
    />
  );
}
