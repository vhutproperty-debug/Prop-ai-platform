import Link from "next/link";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";
import { SectionHeader } from "@/components/project/section-header";
import { projectCanonicalPath } from "@/lib/seo/urls";
import type {
  ProjectPageRelatedArticle,
  ProjectPageRelatedProject,
} from "@/types/project-page";
import { formatPriceRange } from "@/lib/utils";

interface RelatedContentSectionProps {
  projectSlug: string;
  projectName: string;
  relatedProjects: ProjectPageRelatedProject[];
  relatedArticles: ProjectPageRelatedArticle[];
}

export function RelatedContentSection({
  projectSlug,
  projectName,
  relatedProjects,
  relatedArticles,
}: RelatedContentSectionProps) {
  if (!relatedProjects.length && !relatedArticles.length) return null;

  return (
    <section id="related" className="section-padding border-b border-border">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Explore More"
          title="Related projects & guides"
          description={`Continue researching ${projectName} and comparable options.`}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          {relatedArticles.length ? (
            <div>
              <h3 className="text-xl font-semibold">Project guides</h3>
              <ul className="mt-4 space-y-3">
                {relatedArticles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="group block rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-accent/40"
                    >
                      <p className="font-medium group-hover:text-accent">
                        {article.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {CONTENT_TYPE_LABELS[article.contentType as ContentType] ??
                          article.contentType}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {relatedProjects.length ? (
            <div>
              <h3 className="text-xl font-semibold">Similar projects</h3>
              <ul className="mt-4 space-y-3">
                {relatedProjects.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={projectCanonicalPath(item.slug)}
                      className="group block rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-accent/40"
                    >
                      <p className="font-medium group-hover:text-accent">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {[item.builderName, item.priceMin ? formatPriceRange({ min: item.priceMin, max: item.priceMin, currency: "INR" }) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-sm text-muted">
          View project hub:{" "}
          <Link href={projectCanonicalPath(projectSlug)} className="text-accent hover:underline">
            {projectName}
          </Link>
        </p>
      </div>
    </section>
  );
}
