import Link from "next/link";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ContentArticleTable } from "@/components/admin/content/content-article-table";
import { isDbConfigured } from "@/config/env";
import { contentSchedulingService } from "@/services/content-engine/scheduling/content-scheduling.service";
import type { ContentType } from "@/config/content-engine";

export const dynamic = "force-dynamic";

export default async function ContentSchedulePage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const { items } = await contentSchedulingService.listScheduled(1, 50);

  const rows = items.map((item) => ({
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
        <h1 className="text-3xl font-semibold tracking-tight">Publishing Schedule</h1>
        <p className="mt-1 text-sm text-muted">
          Articles queued for scheduled publication.
        </p>
      </div>
      <ContentArticleTable rows={rows} />
    </div>
  );
}
