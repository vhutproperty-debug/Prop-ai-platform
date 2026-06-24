"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkBuilderAction,
  deleteBuilderAction,
  toggleBuilderActiveAction,
  toggleBuilderFeaturedAction,
} from "@/actions/admin/builders";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";

export interface BuilderRow {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  projectCount: number;
  isActive: boolean;
  isFeatured: boolean;
  updatedAt: string;
}

export function BuilderTable({ rows }: { rows: BuilderRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<BuilderRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.logoUrl ? (
            <Image
              src={row.logoUrl}
              alt=""
              width={36}
              height={36}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5 text-sm font-medium">
              {row.name.charAt(0)}
            </div>
          )}
          <div>
            <Link
              href={`/admin/builders/${row._id}/edit`}
              className="font-medium hover:text-accent"
            >
              {row.name}
            </Link>
            <p className="text-xs text-muted">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "website",
      header: "Website",
      render: (row) =>
        row.website ? (
          <a
            href={row.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Visit
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "projectCount",
      header: "Projects",
      render: (row) => row.projectCount,
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleBuilderActiveAction(row._id, !row.isActive);
            router.refresh();
          }}
        >
          <StatusBadge active={row.isActive} />
        </button>
      ),
    },
    {
      key: "isFeatured",
      header: "Featured",
      render: (row) => (
        <button
          type="button"
          className="text-sm"
          onClick={async () => {
            await toggleBuilderFeaturedAction(row._id, !row.isFeatured);
            router.refresh();
          }}
        >
          {row.isFeatured ? "Yes" : "No"}
        </button>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (row) =>
        new Date(row.updatedAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/builders/${row._id}/edit`}
            className="text-sm text-accent hover:underline"
          >
            Edit
          </Link>
          <button
            type="button"
            className="text-sm text-muted hover:text-foreground"
            onClick={async () => {
              await deleteBuilderAction(row._id);
              router.refresh();
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={rows}
      columns={columns}
      onBulkAction={async (ids, action) => {
        const result = await bulkBuilderAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No builders found."
    />
  );
}
