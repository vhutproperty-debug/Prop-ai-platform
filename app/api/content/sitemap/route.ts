import { apiError, apiSuccess } from "@/lib/api/response";
import { contentSitemapService } from "@/services/content-engine/sitemap/content-sitemap.service";

export async function GET() {
  try {
    const entries = await contentSitemapService.buildSitemapEntries();
    return apiSuccess({ entries, count: entries.length });
  } catch (error) {
    return apiError(error);
  }
}
