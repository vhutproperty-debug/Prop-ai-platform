import { Suspense } from "react";
import Link from "next/link";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { CreateLeadForm } from "@/components/admin/leads/create-lead-form";
import { LeadKanbanBoard } from "@/components/admin/leads/lead-kanban-board";
import { LeadStatsCards } from "@/components/admin/leads/lead-stats-cards";
import { LeadsTable } from "@/components/admin/leads/leads-table";
import { LeadsViewToggle } from "@/components/admin/leads/leads-view-toggle";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { Button } from "@/components/ui/button";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminLeadService } from "@/services/admin/leads.service";
import { leadFilterSchema } from "@/validations/lead";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = leadFilterSchema.parse(raw);
  const view = raw.view ?? "table";

  const [stats, listResult, kanban] = await Promise.all([
    adminLeadService.getStats(),
    view === "table" ? adminLeadService.list(filters) : Promise.resolve(null),
    view === "kanban"
      ? adminLeadService.getKanban(filters)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lead Engine"
        description={`${stats.total.toLocaleString("en-IN")} leads in pipeline`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <LeadsViewToggle />
            <Button asChild variant="outline">
              <Link href="/api/leads/export">Export CSV</Link>
            </Button>
          </div>
        }
      />

      <LeadStatsCards stats={stats} />
      <CreateLeadForm />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Suspense>
          <AdminSearchBar defaultValue={filters.search} placeholder="Search leads..." />
        </Suspense>
        <Suspense>
          <AdminFilters type="leads" />
        </Suspense>
      </div>

      {view === "kanban" && kanban ? (
        <LeadKanbanBoard columns={kanban} />
      ) : null}

      {view === "table" && listResult ? (
        <>
          <LeadsTable leads={listResult.items} />
          <AdminPagination
            page={listResult.page}
            totalPages={listResult.totalPages}
            searchParams={raw}
            basePath="/admin/leads"
          />
        </>
      ) : null}
    </div>
  );
}
