import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { absoluteUrl } from "@/lib/seo/urls";

export const contentSitemapService = {
  async getArticleUrls() {
    return withDatabase(() =>
      ContentArticle.find({ status: "published", isActive: true })
        .select("slug updatedAt publishedAt")
        .sort({ publishedAt: -1 })
        .lean()
    );
  },

  async buildSitemapEntries() {
    const articles = await this.getArticleUrls();
    return articles.map((article) => ({
      loc: absoluteUrl(`/articles/${article.slug}`),
      lastmod: (article.publishedAt ?? article.updatedAt).toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    }));
  },
};
