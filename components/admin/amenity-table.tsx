"use client";

import { useRouter } from "next/navigation";
import {
  bulkAmenityAction,
  deleteAmenityAction,
  toggleAmenityActiveAction,
} from "@/actions/admin/amenities";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";

export interface AmenityRow {
  _id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
}

export function AmenityTable({ rows }: { rows: AmenityRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<AmenityRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted">{row.slug}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleAmenityActiveAction(row._id, !row.isActive);
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
            await deleteAmenityAction(row._id);
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
        const result = await bulkAmenityAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No amenities found."
    />
  );
}
