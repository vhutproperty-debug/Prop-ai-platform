import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { ConfigurationForm } from "@/components/admin/configuration-form";
import { ConfigurationTable } from "@/components/admin/configuration-table";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminConfigurationService } from "@/services/admin/configurations.service";
import { adminProjectService } from "@/services/admin/projects.service";
import { configurationFilterSchema, projectFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminConfigurationsPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = configurationFilterSchema.parse(raw);

  const [result, projectsResult] = await Promise.all([
    adminConfigurationService.list(filters),
    adminProjectService.list(projectFilterSchema.parse({ page: "1", limit: "100" })),
  ]);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    name: String(item.name),
    type: String(item.type),
    slug: String(item.slug),
    isActive: Boolean(item.isActive),
    priceRange: item.priceRange as { min: number; max: number; currency?: string },
    projectId: item.projectId as { projectName?: string; slug?: string } | string,
  }));

  const projects = projectsResult.items.map((p) => ({
    _id: String(p._id),
    name: String(p.projectName),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurations"
        description={`${result.total.toLocaleString("en-IN")} unit configurations`}
      />
      <ConfigurationForm projects={projects} />
      <Suspense>
        <AdminSearchBar defaultValue={filters.search} placeholder="Search configurations..." />
      </Suspense>
      <ConfigurationTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/configurations"
      />
    </div>
  );
}
