import { apiError, apiSuccess } from "@/lib/api/response";
import { siteSitemapService } from "@/services/sitemap/site-sitemap.service";

export async function GET() {
  try {
    const entries = await siteSitemapService.buildAllEntries();
    const projects = entries.filter((e) => e.type === "project");
    const articles = entries.filter((e) => e.type === "article");

    return apiSuccess({
      entries,
      count: entries.length,
      projects: projects.length,
      articles: articles.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
