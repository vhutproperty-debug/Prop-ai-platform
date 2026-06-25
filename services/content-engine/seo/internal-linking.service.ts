import type { ContentSourceContext, GeneratedArticlePayload } from "@/types/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { Builder } from "@/models/Builder";
import { Location } from "@/models/Location";
import { ContentArticle } from "@/models/ContentArticle";

export const internalLinkingService = {
  async discoverRelated(context: ContentSourceContext) {
    return withDatabase(async () => {
      const [projects, builders, localities, articles] = await Promise.all([
        context.locality?.slug
          ? Project.find({
              microMarket: context.project?.microMarket,
              isActive: true,
              slug: { $ne: context.project?.slug },
            })
              .select("slug projectName")
              .limit(5)
              .lean()
          : context.project?.microMarket
            ? Project.find({
                microMarket: context.project.microMarket,
                isActive: true,
                slug: { $ne: context.project.slug },
              })
                .select("slug projectName")
                .limit(5)
                .lean()
            : [],
        context.project?.builderSlug
          ? Builder.find({
              slug: { $ne: context.project.builderSlug },
              isActive: true,
            })
              .select("slug name")
              .limit(3)
              .lean()
          : [],
        context.project?.locationSlug
          ? Location.find({
              slug: { $ne: context.project.locationSlug },
              isActive: true,
            })
              .select("slug name")
              .limit(3)
              .lean()
          : [],
        context.project?.slug
          ? ContentArticle.find({
              projectSlug: context.project.slug,
              status: "published",
            })
              .select("slug title")
              .limit(5)
              .lean()
          : [],
      ]);

      return { projects, builders, localities, articles };
    });
  },

  async enrichLinks(
    article: GeneratedArticlePayload,
    context: ContentSourceContext
  ): Promise<GeneratedArticlePayload> {
    const related = await this.discoverRelated(context);

    const internalLinks = [
      ...(context.project?.slug
        ? [{ label: context.project.name, href: `/project/${context.project.slug}`, entityType: "project" as const, entitySlug: context.project.slug }]
        : []),
      ...(context.builder?.slug
        ? [{ label: context.builder.name, href: `/builders/${context.builder.slug}`, entityType: "builder" as const, entitySlug: context.builder.slug }]
        : []),
      ...related.projects.map((p) => ({
        label: p.projectName,
        href: `/project/${p.slug}`,
        entityType: "project" as const,
        entitySlug: p.slug,
      })),
      ...related.articles.map((a) => ({
        label: a.title,
        href: `/articles/${a.slug}`,
        entityType: "article" as const,
        entitySlug: a.slug,
      })),
    ];

    return {
      ...article,
      internalLinks,
      relatedProjects: [
        ...new Set([
          ...article.relatedProjects,
          ...related.projects.map((p) => p.slug),
        ]),
      ],
      relatedBuilders: [
        ...new Set([
          ...article.relatedBuilders,
          ...related.builders.map((b) => b.slug),
        ]),
      ],
      relatedLocalities: [
        ...new Set([
          ...article.relatedLocalities,
          ...related.localities.map((l) => l.slug),
        ]),
      ],
      relatedArticles: related.articles.map((a) => a.slug),
    };
  },
};
