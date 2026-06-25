import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { ContentArticleTable } from "@/components/admin/content/content-article-table";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";
import { parseSearchParams } from "@/lib/admin/parse-params";
import { contentArticleService } from "@/services/content-engine/articles/content-article.service";
import { contentFilterSchema } from "@/validations/content-engine";
import type { ContentType } from "@/config/content-engine";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContentArticlesPage({ searchParams }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const raw = parseSearchParams(await searchParams);
  const filters = contentFilterSchema.parse(raw);
  const result = await contentArticleService.list(filters);

  const rows = result.items.map((item) => ({
    _id: String(item._id),
    title: String(item.title),
    slug: String(item.slug),
    contentType: item.contentType as ContentType,
    status: String(item.status),
    seoScore: item.seoScore,
    projectSlug: item.projectSlug,
    isAiGenerated: Boolean(item.isAiGenerated),
    isHumanEdited: Boolean(item.isHumanEdited),
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm text-muted hover:text-foreground">
        ← Content Engine
      </Link>
      <AdminPageHeader
        title="Articles"
        description={`${result.total.toLocaleString("en-IN")} content articles`}
        createHref="/admin/content/generate"
        createLabel="Generate"
      />
      <Suspense>
        <AdminSearchBar defaultValue={filters.search} placeholder="Search articles..." />
      </Suspense>
      <ContentArticleTable rows={rows} />
      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        searchParams={raw}
        basePath="/admin/content/articles"
      />
    </div>
  );
}
