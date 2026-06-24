import { Suspense } from "react";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AmenityForm } from "@/components/admin/amenity-form";
import { AmenityTable } from "@/components/admin/amenity-table";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminAmenityService } from "@/services/admin/amenities.service";
import { amenityFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAmenitiesPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = amenityFilterSchema.parse(raw);
  const result = await adminAmenityService.list(filters);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    name: String(item.name),
    slug: String(item.slug),
    category: String(item.category),
    isActive: Boolean(item.isActive),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Amenities"
        description={`${result.total.toLocaleString("en-IN")} amenities`}
      />
      <AmenityForm />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search amenities..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="amenities" />
        </Suspense>
      </div>
      <AmenityTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/amenities"
      />
    </div>
  );
}
