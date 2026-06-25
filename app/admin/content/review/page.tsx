import Link from "next/link";
import { Suspense } from "react";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ContentArticleTable } from "@/components/admin/content/content-article-table";
import { isDbConfigured } from "@/config/env";
import { contentArticleService } from "@/services/content-engine/articles/content-article.service";
import { contentFilterSchema } from "@/validations/content-engine";
import type { ContentType } from "@/config/content-engine";

export const dynamic = "force-dynamic";

export default async function ContentReviewPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const result = await contentArticleService.list(
    contentFilterSchema.parse({ page: "1", limit: "100", status: "pending_review" })
  );

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
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Review Queue</h1>
        <p className="mt-1 text-sm text-muted">
          Approve or reject AI-generated articles before publishing.
        </p>
      </div>
      <Suspense>
        <ContentArticleTable rows={rows} />
      </Suspense>
    </div>
  );
}
