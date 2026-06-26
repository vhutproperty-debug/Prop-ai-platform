import { apiError, apiSuccess } from "@/lib/api/response";
import { siteSitemapService } from "@/services/sitemap/site-sitemap.service";

export async function GET() {
  try {
    const entries = await siteSitemapService.buildAllEntries();
    const articles = entries.filter((entry) => entry.type === "article");
    return apiSuccess({
      entries: articles,
      count: articles.length,
      projects: entries.filter((entry) => entry.type === "project").length,
      total: entries.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
