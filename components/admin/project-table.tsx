"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkProjectAction,
  deleteProjectAction,
  toggleProjectActiveAction,
  toggleProjectFeaturedAction,
} from "@/actions/admin/projects";
import {
  AdminDataTable,
  StatusBadge,
  type AdminColumn,
} from "@/components/admin/admin-data-table";
import { PROJECT_STATUS_LABELS } from "@/lib/project/format";

export interface ProjectRow {
  _id: string;
  projectName: string;
  builderName: string;
  locationName?: string;
  status: string;
  featured: boolean;
  slug: string;
  isActive: boolean;
  updatedAt: string;
}

export function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const router = useRouter();

  const columns: AdminColumn<ProjectRow>[] = [
    {
      key: "projectName",
      header: "Name",
      render: (row) => (
        <div>
          <Link
            href={`/admin/projects/${row._id}/edit`}
            className="font-medium hover:text-accent"
          >
            {row.projectName}
          </Link>
          <p className="text-xs text-muted">{row.slug}</p>
        </div>
      ),
    },
    { key: "builderName", header: "Builder", render: (row) => row.builderName },
    {
      key: "locationName",
      header: "Location",
      render: (row) => row.locationName ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        PROJECT_STATUS_LABELS[row.status as keyof typeof PROJECT_STATUS_LABELS] ??
        row.status,
    },
    {
      key: "featured",
      header: "Featured",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleProjectFeaturedAction(row._id, !row.featured);
            router.refresh();
          }}
        >
          {row.featured ? "Yes" : "No"}
        </button>
      ),
    },
    {
      key: "isActive",
      header: "Published",
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            await toggleProjectActiveAction(row._id, !row.isActive);
            router.refresh();
          }}
        >
          <StatusBadge active={row.isActive} />
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
            href={`/project/${row.slug}`}
            className="text-sm text-muted hover:text-foreground"
            target="_blank"
          >
            View
          </Link>
          <Link
            href={`/admin/projects/${row._id}/edit`}
            className="text-sm text-accent hover:underline"
          >
            Edit
          </Link>
          <button
            type="button"
            className="text-sm text-muted hover:text-foreground"
            onClick={async () => {
              await deleteProjectAction(row._id);
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
        const result = await bulkProjectAction({ ids, action });
        return { success: result.success };
      }}
      emptyMessage="No projects found."
    />
  );
}
