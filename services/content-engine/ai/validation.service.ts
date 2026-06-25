import type { GeneratedArticlePayload } from "@/types/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";

export const contentValidationService = {
  validatePayload(payload: GeneratedArticlePayload): string[] {
    const errors: string[] = [];
    if (!payload.title?.trim()) errors.push("Title is required");
    if (!payload.slug?.trim()) errors.push("Slug is required");
    if (!payload.introduction?.trim()) errors.push("Introduction is required");
    if (!payload.sections?.length) errors.push("At least one section is required");
    if (payload.seoTitle && payload.seoTitle.length > 70) {
      errors.push("SEO title exceeds 70 characters");
    }
    if (payload.seoDescription && payload.seoDescription.length > 165) {
      errors.push("SEO description exceeds 165 characters");
    }
    return errors;
  },

  async detectDuplicateSlug(slug: string, excludeId?: string): Promise<boolean> {
    return withDatabase(async () => {
      const query: Record<string, unknown> = { slug };
      if (excludeId) query._id = { $ne: excludeId };
      const existing = await ContentArticle.findOne(query).select("_id").lean();
      return Boolean(existing);
    });
  },

  async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await this.detectDuplicateSlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  },
};
