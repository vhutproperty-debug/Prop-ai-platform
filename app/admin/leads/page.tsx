import { Suspense } from "react";
import Link from "next/link";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { Button } from "@/components/ui/button";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminLeadService } from "@/services/admin/leads.service";
import { leadFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = leadFilterSchema.parse(raw);
  const result = await adminLeadService.list(filters);

  const rows = result.items.map((lead) => ({
    _id: String(lead._id),
    name: String(lead.name),
    email: String(lead.email),
    phone: String(lead.phone),
    status: String(lead.status),
    source: String(lead.source),
    createdAt: new Date(lead.createdAt).toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description={`${result.total.toLocaleString("en-IN")} leads in pipeline`}
        action={
          <Button asChild variant="outline">
            <Link href="/api/leads/export">Export CSV</Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search leads..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="leads" />
        </Suspense>
      </div>
      <AdminLeadsTable leads={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/leads"
      />
    </div>
  );
}
