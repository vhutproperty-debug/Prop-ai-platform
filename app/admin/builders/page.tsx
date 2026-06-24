import { Suspense } from "react";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { BuilderTable } from "@/components/admin/builder-table";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminBuilderService } from "@/services/admin/builders.service";
import { builderFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminBuildersPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = builderFilterSchema.parse(raw);
  const result = await adminBuilderService.list(filters);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    name: String(item.name),
    slug: String(item.slug),
    logoUrl: item.logoUrl ? String(item.logoUrl) : undefined,
    website: item.website ? String(item.website) : undefined,
    projectCount: Number(item.projectCount ?? 0),
    isActive: Boolean(item.isActive),
    isFeatured: Boolean(item.isFeatured),
    updatedAt: new Date(item.updatedAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Builders"
        description={`${result.total.toLocaleString("en-IN")} builders`}
        createHref="/admin/builders/new"
        createLabel="Add Builder"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search builders..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="builders" />
        </Suspense>
      </div>
      <BuilderTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/builders"
      />
    </div>
  );
}
