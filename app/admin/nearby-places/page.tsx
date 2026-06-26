import { Suspense } from "react";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { NearbyPlaceForm } from "@/components/admin/nearby-place-form";
import { NearbyPlaceTable } from "@/components/admin/nearby-place-table";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminNearbyPlaceService } from "@/services/admin/nearby-places.service";
import { nearbyPlaceFilterSchema } from "@/validations/location-intelligence";
import type { PoiType } from "@/config/location-intelligence";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminNearbyPlacesPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = nearbyPlaceFilterSchema.parse(raw);
  const [result, projects] = await Promise.all([
    adminNearbyPlaceService.list(filters),
    adminNearbyPlaceService.getProjectOptions(),
  ]);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    name: String(item.name),
    slug: String(item.slug),
    type: String(item.type) as PoiType,
    distanceLabel: item.distanceLabel ? String(item.distanceLabel) : undefined,
    travelTimeLabel: item.travelTimeLabel ? String(item.travelTimeLabel) : undefined,
    source: String(item.source),
    isActive: Boolean(item.isActive),
  }));

  const projectOptions = projects.map((p) => ({
    _id: String(p._id),
    projectName: String(p.projectName),
    slug: String(p.slug),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nearby Places"
        description={`${result.total.toLocaleString("en-IN")} location intelligence records`}
      />
      {projectOptions.length ? (
        <NearbyPlaceForm projects={projectOptions} />
      ) : (
        <p className="rounded-3xl border border-border bg-white p-6 text-sm text-muted">
          Add a project first to attach nearby schools, hospitals, and metro stations.
        </p>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search places..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="nearby-places" />
        </Suspense>
      </div>
      <NearbyPlaceTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/nearby-places"
      />
    </div>
  );
}
