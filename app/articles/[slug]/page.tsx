import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { NotFoundError } from "@/lib/errors";
import { contentArticleService } from "@/services/content-engine/articles/content-article.service";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadArticle(slug: string) {
  if (!isDbConfigured) throw new Error("Database is not configured");
  try {
    return await contentArticleService.getBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDbConfigured) return { title: "Article" };

  try {
    const article = await contentArticleService.getBySlug(slug);
    return {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.featuredSummary,
      alternates: article.canonicalUrl
        ? { canonical: article.canonicalUrl }
        : undefined,
      openGraph: {
        title: article.ogTitle ?? article.title,
        description: article.ogDescription ?? article.featuredSummary,
        images: article.ogImage ? [article.ogImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: article.twitterTitle ?? article.title,
        description: article.twitterDescription ?? article.featuredSummary,
        images: article.twitterImage ? [article.twitterImage] : undefined,
      },
    };
  } catch {
    return { title: "Article Not Found" };
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  const schemaJson = article.schemaData
    ? JSON.stringify(article.schemaData)
    : null;

  return (
    <>
      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      )}

      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8">
          <p className="text-sm text-muted">
            {CONTENT_TYPE_LABELS[article.contentType as ContentType]}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {article.title}
          </h1>
          {article.featuredSummary && (
            <p className="mt-4 text-lg text-muted">{article.featuredSummary}</p>
          )}
          {article.publishedAt && (
            <p className="mt-4 text-xs text-muted">
              Published {new Date(article.publishedAt).toLocaleDateString("en-IN")}
            </p>
          )}
        </header>

        {article.tableOfContents?.length > 0 && (
          <nav className="mb-8 rounded-2xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold">Table of Contents</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {article.tableOfContents.map(
                (item: { id: string; label: string }) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-accent hover:underline">
                      {item.label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </nav>
        )}

        {article.introduction && (
          <section className="prose prose-neutral mb-8 max-w-none">
            <p>{article.introduction}</p>
          </section>
        )}

        {(article.sections ?? []).map(
          (section: { id: string; heading: string; body: string }) => (
            <section key={section.id} id={section.id} className="mb-8">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              <p className="mt-4 text-muted leading-relaxed">{section.body}</p>
            </section>
          )
        )}

        {(article.faqs ?? []).length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-4">
              {(article.faqs ?? []).map(
                (faq: { question: string; answer: string }, i: number) => (
                  <div key={i} className="rounded-2xl border border-border p-4">
                    <h3 className="font-medium">{faq.question}</h3>
                    <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {article.callToAction && (
          <section className="mb-8 rounded-2xl bg-accent-muted p-6">
            <p className="text-sm">{article.callToAction}</p>
            {article.projectSlug && (
              <Link
                href={`/project/${article.projectSlug}`}
                className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
              >
                View Project →
              </Link>
            )}
          </section>
        )}

        {(article.internalLinks ?? []).length > 0 && (
          <section className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold">Related Links</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {(article.internalLinks ?? []).map(
                (link: { label: string; href: string }, i: number) => (
                  <li key={i}>
                    <Link href={link.href} className="text-accent hover:underline">
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
