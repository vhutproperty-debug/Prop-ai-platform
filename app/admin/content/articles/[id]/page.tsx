import Link from "next/link";
import { notFound } from "next/navigation";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ContentArticleTable } from "@/components/admin/content/content-article-table";
import { isDbConfigured } from "@/config/env";
import { contentArticleService } from "@/services/content-engine/articles/content-article.service";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentArticleDetailPage({ params }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const { id } = await params;
  let article;
  try {
    article = await contentArticleService.getById(id);
  } catch {
    notFound();
  }

  const row = {
    _id: String(article._id),
    title: String(article.title),
    slug: String(article.slug),
    contentType: article.contentType as ContentType,
    status: String(article.status),
    seoScore: article.seoScore,
    projectSlug: article.projectSlug,
    isAiGenerated: Boolean(article.isAiGenerated),
    isHumanEdited: Boolean(article.isHumanEdited),
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/content/articles" className="text-sm text-muted hover:text-foreground">
        ← Articles
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{CONTENT_TYPE_LABELS[article.contentType as ContentType]}</Badge>
          <Badge variant="outline">{article.status}</Badge>
          {article.seoScore != null && <Badge variant="outline">SEO {article.seoScore}</Badge>}
        </div>
      </div>

      <ContentArticleTable rows={[row]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted">Title:</span> {article.seoTitle}</p>
            <p><span className="text-muted">Description:</span> {article.seoDescription}</p>
            <p><span className="text-muted">Canonical:</span> {article.canonicalUrl}</p>
            <p><span className="text-muted">Readability:</span> {article.readabilityScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            {article.featuredSummary}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-sm">
          {article.introduction}
        </CardContent>
      </Card>

      {(article.sections ?? []).map((section: { id: string; heading: string; body: string }) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{section.body}</CardContent>
        </Card>
      ))}

      {(article.faqs ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(article.faqs ?? []).map((faq: { question: string; answer: string }, i: number) => (
              <div key={i}>
                <p className="font-medium">{faq.question}</p>
                <p className="mt-1 text-sm text-muted">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
