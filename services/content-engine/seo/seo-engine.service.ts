import type { ContentSourceContext, GeneratedArticlePayload } from "@/types/content-engine";
import { absoluteUrl, truncateDescription } from "@/lib/seo/urls";

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const words = countWords(text);
  const syllables = text.split(/\s+/).reduce((acc, word) => acc + Math.max(1, word.length / 3), 0);
  if (!words) return 0;
  return Math.min(100, Math.max(0, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)));
}

function keywordDensity(text: string, keywords: string[]): Record<string, number> {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const total = words.length || 1;
  const density: Record<string, number> = {};
  for (const kw of keywords) {
    const kwWords = kw.toLowerCase().split(/\s+/);
    let count = 0;
    for (let i = 0; i <= words.length - kwWords.length; i++) {
      if (kwWords.every((w, j) => words[i + j] === w)) count++;
    }
    density[kw] = Math.round((count / total) * 10000) / 100;
  }
  return density;
}

export const seoEngineService = {
  analyze(article: GeneratedArticlePayload) {
    const fullText = [
      article.introduction,
      ...article.sections.map((s) => s.body),
      ...article.faqs.map((f) => `${f.question} ${f.answer}`),
    ].join(" ");

    const readabilityScore = Math.round(fleschReadingEase(fullText));
    const kwDensity = keywordDensity(fullText, article.keywords ?? []);
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!article.seoTitle) issues.push("Missing SEO title");
    if (!article.seoDescription) issues.push("Missing meta description");
    if (article.seoTitle && article.seoTitle.length > 60) {
      recommendations.push("Shorten SEO title to under 60 characters");
    }
    if (countWords(fullText) < 300) {
      recommendations.push("Increase content length to at least 300 words");
    }
    if (!article.faqs.length) recommendations.push("Add FAQ section for rich snippets");

    let seoScore = 50;
    if (article.seoTitle) seoScore += 10;
    if (article.seoDescription) seoScore += 10;
    if (article.faqs.length >= 3) seoScore += 10;
    if (readabilityScore >= 50) seoScore += 10;
    if (countWords(fullText) >= 500) seoScore += 10;
    if (article.internalLinks?.length) seoScore += 5;
    seoScore = Math.min(100, seoScore);

    return {
      keywordDensity: kwDensity,
      readabilityScore,
      seoScore,
      issues,
      recommendations,
    };
  },

  buildMeta(article: GeneratedArticlePayload, slug: string) {
    const canonicalUrl = absoluteUrl(`/articles/${slug}`);
    const title = article.seoTitle ?? article.title;
    const description = truncateDescription(
      article.seoDescription ?? article.featuredSummary ?? article.introduction,
      160
    );

    return {
      seoTitle: title,
      seoDescription: description,
      canonicalUrl,
      ogTitle: title,
      ogDescription: description,
      ogImage: article.imageSuggestions?.[0]?.url,
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: article.imageSuggestions?.[0]?.url,
    };
  },

  buildArticleSchema(
    article: GeneratedArticlePayload,
    context: ContentSourceContext
  ): Record<string, unknown> {
    const url = absoluteUrl(`/articles/${article.slug}`);
    const schemas: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.seoDescription ?? article.featuredSummary,
        url,
        author: {
          "@type": "Organization",
          name: context.project?.builderName ?? "PropAI",
        },
        datePublished: new Date().toISOString(),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Articles", item: absoluteUrl("/articles") },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ];

    if (article.faqs.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    return { "@graph": schemas };
  },
};
