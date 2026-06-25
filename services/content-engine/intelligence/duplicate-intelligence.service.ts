import type { ContentType } from "@/config/content-engine";
import type { DuplicateIntelligenceResult } from "@/types/content-research";
import type { ContentFaq } from "@/types/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(/\s+/));
  const wordsB = new Set(normalizeText(b).split(/\s+/));
  if (!wordsA.size || !wordsB.size) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export const duplicateIntelligenceService = {
  async analyze(input: {
    contentType: ContentType;
    projectSlug?: string;
    keywords?: string[];
    faqs?: ContentFaq[];
    title?: string;
    excludeArticleId?: string;
  }): Promise<DuplicateIntelligenceResult[]> {
    return withDatabase(async () => {
      const results: DuplicateIntelligenceResult[] = [];
      const query: Record<string, unknown> = {
        status: { $in: ["draft", "pending_review", "approved", "scheduled", "published"] },
      };
      if (input.excludeArticleId) query._id = { $ne: input.excludeArticleId };

      const existing = await ContentArticle.find({
        ...query,
        ...(input.projectSlug
          ? { projectSlug: input.projectSlug, contentType: input.contentType }
          : {}),
      })
        .select("_id slug title contentType keywords faqs projectSlug")
        .lean();

      for (const article of existing) {
        if (input.projectSlug && article.contentType === input.contentType) {
          results.push({
            type: "duplicate_topic",
            severity: "high",
            existingArticleId: String(article._id),
            existingSlug: article.slug,
            message: `${input.contentType} already exists for project ${input.projectSlug}`,
            suggestion: "update",
          });
        }

        if (input.title && wordOverlap(input.title, article.title) > 0.75) {
          results.push({
            type: "near_duplicate",
            severity: "medium",
            existingArticleId: String(article._id),
            existingSlug: article.slug,
            message: `Title similar to existing article "${article.title}"`,
            suggestion: "merge",
          });
        }
      }

      if (input.keywords?.length) {
        const keywordSet = new Set(input.keywords.map((k) => normalizeText(k)));
        const cannibalization = await ContentArticle.find({
          ...query,
          keywords: { $in: [...keywordSet] },
          status: "published",
        })
          .select("_id slug title keywords")
          .limit(10)
          .lean();

        for (const article of cannibalization) {
          const shared = (article.keywords ?? []).filter((k: string) =>
            keywordSet.has(normalizeText(k))
          );
          if (shared.length >= 2) {
            results.push({
              type: "keyword_cannibalization",
              severity: "medium",
              existingArticleId: String(article._id),
              existingSlug: article.slug,
              message: `Keyword overlap: ${shared.join(", ")}`,
              suggestion: "review",
            });
          }
        }
      }

      if (input.faqs?.length) {
        const publishedWithFaqs = await ContentArticle.find({
          ...query,
          "faqs.0": { $exists: true },
          ...(input.projectSlug ? { projectSlug: input.projectSlug } : {}),
        })
          .select("_id slug faqs")
          .lean();

        for (const article of publishedWithFaqs) {
          const existingQuestions = new Set(
            (article.faqs ?? []).map((f: { question: string }) =>
              normalizeText(f.question)
            )
          );
          const overlaps = input.faqs.filter((f) =>
            existingQuestions.has(normalizeText(f.question))
          );
          if (overlaps.length >= 2) {
            results.push({
              type: "overlapping_faq",
              severity: "low",
              existingArticleId: String(article._id),
              existingSlug: article.slug,
              message: `${overlaps.length} FAQ questions overlap with existing article`,
              suggestion: "merge",
            });
          }
        }
      }

      return results;
    });
  },
};
