import { Suspense } from "react";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ProjectTable } from "@/components/admin/project-table";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminProjectService } from "@/services/admin/projects.service";
import { projectFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = projectFilterSchema.parse(raw);
  const result = await adminProjectService.list(filters);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    projectName: String(item.projectName),
    builderName: String(item.builderName),
    locationName: item.locationName ? String(item.locationName) : undefined,
    status: String(item.status),
    featured: Boolean(item.featured),
    slug: String(item.slug),
    isActive: Boolean(item.isActive),
    updatedAt: new Date(item.updatedAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description={`${result.total.toLocaleString("en-IN")} projects`}
        createHref="/admin/projects/new"
        createLabel="Add Project"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search projects..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="projects" />
        </Suspense>
      </div>
      <ProjectTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/projects"
      />
    </div>
  );
}
