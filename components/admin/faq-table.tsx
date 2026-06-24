"use client";

import { useRouter } from "next/navigation";
import {
  bulkFaqAction,
  deleteFaqAction,
  toggleFaqActiveAction,
} from "@/actions/admin/faqs";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";

export interface FaqRow {
  _id: string;
  question: string;
  entityType: string;
  entityId: string;
  order: number;
  isActive: boolean;
}

export function FaqTable({ rows }: { rows: FaqRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<FaqRow>[] = [
    {
      key: "question",
      header: "Question",
      render: (row) => <p className="max-w-md truncate font-medium">{row.question}</p>,
    },
    { key: "entityType", header: "Entity", render: (row) => row.entityType },
    { key: "order", header: "Order", render: (row) => row.order },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleFaqActiveAction(row._id, !row.isActive);
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
            await deleteFaqAction(row._id);
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
        const result = await bulkFaqAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No FAQs found."
    />
  );
}
