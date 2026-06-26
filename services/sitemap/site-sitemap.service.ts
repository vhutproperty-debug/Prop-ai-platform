import { withDatabase } from "@/lib/db/with-database";
import { Project } from "@/models/Project";
import { ContentArticle } from "@/models/ContentArticle";
import { contentSitemapService } from "@/services/content-engine/sitemap/content-sitemap.service";
import { absoluteUrl, projectCanonicalPath } from "@/lib/seo/urls";

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "weekly" | "daily" | "monthly";
  priority: number;
  type: "project" | "article";
}

export const siteSitemapService = {
  async getProjectUrls() {
    return withDatabase(() =>
      Project.find({ isActive: true })
        .select("slug updatedAt")
        .sort({ updatedAt: -1 })
        .lean()
    );
  },

  async buildAllEntries(): Promise<SitemapEntry[]> {
    const [projects, articleEntries] = await Promise.all([
      this.getProjectUrls(),
      contentSitemapService.buildSitemapEntries(),
    ]);

    const projectEntries: SitemapEntry[] = projects.map((project) => ({
      loc: absoluteUrl(projectCanonicalPath(String(project.slug))),
      lastmod: new Date(project.updatedAt).toISOString(),
      changefreq: "weekly" as const,
      priority: 0.9,
      type: "project" as const,
    }));

    const articles: SitemapEntry[] = articleEntries.map((entry) => ({
      ...entry,
      type: "article" as const,
    }));

    return [...projectEntries, ...articles];
  },

  async getProjectArticleCount(projectSlug: string) {
    return withDatabase(() =>
      ContentArticle.countDocuments({
        projectSlug,
        status: "published",
        isActive: true,
      })
    );
  },
};
