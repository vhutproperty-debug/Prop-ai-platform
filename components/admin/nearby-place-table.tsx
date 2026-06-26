"use client";

import { useRouter } from "next/navigation";
import {
  bulkNearbyPlaceAction,
  deleteNearbyPlaceAction,
  toggleNearbyPlaceActiveAction,
} from "@/actions/admin/nearby-places";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";
import { POI_TYPE_LABELS, type PoiType } from "@/config/location-intelligence";

export interface NearbyPlaceRow {
  _id: string;
  name: string;
  slug: string;
  type: PoiType;
  distanceLabel?: string;
  travelTimeLabel?: string;
  source: string;
  isActive: boolean;
}

export function NearbyPlaceTable({ rows }: { rows: NearbyPlaceRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<NearbyPlaceRow>[] = [
    {
      key: "name",
      header: "Place",
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => POI_TYPE_LABELS[row.type] ?? row.type,
    },
    {
      key: "distance",
      header: "Distance",
      render: (row) => row.distanceLabel ?? "—",
    },
    {
      key: "travelTime",
      header: "Travel",
      render: (row) => row.travelTimeLabel ?? "—",
    },
    {
      key: "source",
      header: "Source",
      render: (row) => row.source,
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleNearbyPlaceActiveAction(row._id, !row.isActive);
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
            await deleteNearbyPlaceAction(row._id);
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
        const result = await bulkNearbyPlaceAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No nearby places found."
    />
  );
}
