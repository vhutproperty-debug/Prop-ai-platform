"use client";

import { useRouter } from "next/navigation";
import {
  bulkConfigurationAction,
  deleteConfigurationAction,
  toggleConfigurationActiveAction,
} from "@/actions/admin/configurations";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";
import { formatPriceRange } from "@/lib/utils";

export interface ConfigurationRow {
  _id: string;
  name: string;
  type: string;
  slug: string;
  isActive: boolean;
  priceRange: { min: number; max: number; currency?: string };
  projectId?: { projectName?: string; slug?: string } | string;
}

export function ConfigurationTable({ rows }: { rows: ConfigurationRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<ConfigurationRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted">{row.type}</p>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (row) => {
        const project = row.projectId;
        if (project && typeof project === "object") {
          return project.projectName ?? "—";
        }
        return "—";
      },
    },
    {
      key: "price",
      header: "Price Range",
      render: (row) => formatPriceRange(row.priceRange),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleConfigurationActiveAction(row._id, !row.isActive);
            router.refresh();
          }}
        >
          <StatusBadge active={row.isActive} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className="text-sm text-muted hover:text-foreground"
          onClick={async () => {
            await deleteConfigurationAction(row._id);
            router.refresh();
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
        const result = await bulkConfigurationAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No configurations found."
    />
  );
}
