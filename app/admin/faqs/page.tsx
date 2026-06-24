import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { FaqForm } from "@/components/admin/faq-form";
import { FaqTable } from "@/components/admin/faq-table";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { adminFaqService } from "@/services/admin/faqs.service";
import { adminProjectService } from "@/services/admin/projects.service";
import { faqFilterSchema, projectFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminFaqsPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = faqFilterSchema.parse(raw);

  const [result, projectsResult] = await Promise.all([
    adminFaqService.list(filters),
    adminProjectService.list(projectFilterSchema.parse({ page: "1", limit: "100" })),
  ]);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    question: String(item.question),
    entityType: String(item.entityType),
    entityId: String(item.entityId),
    order: Number(item.order ?? 0),
    isActive: Boolean(item.isActive),
  }));

  const projects = projectsResult.items.map((p) => ({
    _id: String(p._id),
    name: String(p.projectName),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQs"
        description={`${result.total.toLocaleString("en-IN")} frequently asked questions`}
      />
      <FaqForm projects={projects} />
      <Suspense>
        <AdminSearchBar defaultValue={filters.search} placeholder="Search FAQs..." />
      </Suspense>
      <FaqTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/faqs"
      />
    </div>
  );
}
