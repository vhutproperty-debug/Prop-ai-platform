import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { MediaLibrary } from "@/components/admin/media-library";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminMediaService } from "@/services/admin/media.service";
import { adminProjectService } from "@/services/admin/projects.service";
import { mediaFilterSchema, projectFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminMediaPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = mediaFilterSchema.parse(raw);

  const [result, projectsResult] = await Promise.all([
    adminMediaService.list(filters),
    adminProjectService.list(projectFilterSchema.parse({ page: "1", limit: "100" })),
  ]);

  const items = result.items.map((item) => ({
    _id: String(item._id),
    url: String(item.url),
    alt: item.alt ? String(item.alt) : undefined,
    publicId: item.publicId ? String(item.publicId) : undefined,
    entityType: String(item.entityType),
    type: String(item.type),
    isActive: Boolean(item.isActive),
    createdAt: new Date(item.createdAt).toISOString(),
  }));

  const projects = projectsResult.items.map((p) => ({
    _id: String(p._id),
    name: String(p.projectName),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media Library"
        description={`${result.total.toLocaleString("en-IN")} images · Cloudinary`}
      />
      <Suspense>
        <AdminSearchBar defaultValue={filters.search} placeholder="Search media..." />
      </Suspense>
      <MediaLibrary items={items} projects={projects} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/media"
      />
    </div>
  );
}
