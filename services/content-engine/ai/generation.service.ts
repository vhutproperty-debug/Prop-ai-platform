import type { ContentType } from "@/config/content-engine";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type {
  ContentSourceContext,
  GeneratedArticlePayload,
  ContentSection,
  ContentFaq,
  ContentTocItem,
} from "@/types/content-engine";
import { slugify } from "@/lib/utils";
import { llmService } from "@/services/content-engine/ai/llm.service";
import { seoEngineService } from "@/services/content-engine/seo/seo-engine.service";
import { internalLinkingService } from "@/services/content-engine/seo/internal-linking.service";

function formatPrice(min?: number, max?: number): string {
  if (!min && !max) return "Price on request";
  const fmt = (n: number) =>
    n >= 10_000_000
      ? `₹${(n / 10_000_000).toFixed(2)} Cr`
      : `₹${(n / 100_000).toFixed(1)} L`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

function buildTemplateArticle(
  context: ContentSourceContext,
  contentType: ContentType
): GeneratedArticlePayload {
  const project = context.project;
  const builder = context.builder;
  const locality = context.locality;
  const typeLabel = CONTENT_TYPE_LABELS[contentType];

  const subject = project?.name ?? builder?.name ?? locality?.name ?? "Property";
  const builderName = project?.builderName ?? builder?.name ?? "Developer";
  const locationName = project?.locationName ?? locality?.name ?? "Mumbai";
  const slug = slugify(`${subject}-${typeLabel}`);

  const sections: ContentSection[] = [
    {
      id: "overview",
      heading: `${subject} Overview`,
      body: `${subject} by ${builderName} is located in ${locationName}${project?.microMarket ? ` (${project.microMarket})` : ""}. ${project?.tagline ?? `This ${typeLabel.toLowerCase()} covers key facts buyers need before making a decision.`}`,
      order: 1,
    },
    {
      id: "pricing",
      heading: "Pricing & Configurations",
      body: `Price range: ${formatPrice(project?.priceMin, project?.priceMax)}. ${
        project?.configurations?.length
          ? `Available configurations: ${project.configurations.map((c) => c.type).join(", ")}.`
          : "Multiple configurations may be available."
      }`,
      order: 2,
    },
    {
      id: "amenities",
      heading: "Amenities & Lifestyle",
      body: project?.amenities?.length
        ? `Key amenities include ${project.amenities.slice(0, 12).join(", ")}.`
        : "The project offers lifestyle amenities suited for modern urban living.",
      order: 3,
    },
    {
      id: "location",
      heading: "Location & Connectivity",
      body: `${locationName} offers strong connectivity across Mumbai. ${locality?.description ?? "The micro-market continues to attract homebuyers and investors."}`,
      order: 4,
    },
  ];

  const faqs: ContentFaq[] = [
    {
      question: `What is the price of ${subject}?`,
      answer: `The indicative price range is ${formatPrice(project?.priceMin, project?.priceMax)}.`,
      order: 1,
    },
    {
      question: `Who is the builder of ${subject}?`,
      answer: `${subject} is developed by ${builderName}.`,
      order: 2,
    },
    {
      question: project?.reraNumber
        ? `What is the RERA number for ${subject}?`
        : `Where is ${subject} located?`,
      answer: project?.reraNumber
        ? `RERA registration: ${project.reraNumber}.`
        : `${subject} is located in ${locationName}.`,
      order: 3,
    },
  ];

  const toc: ContentTocItem[] = sections.map((s) => ({
    id: s.id,
    label: s.heading,
    level: 2,
  }));

  const title = `${subject}: ${typeLabel} | ${locationName}`;
  const intro = `Explore this comprehensive ${typeLabel.toLowerCase()} for ${subject} by ${builderName} in ${locationName}. Structured for buyers comparing projects, prices, amenities, and location advantages.`;

  const keywords = [
    subject,
    builderName,
    locationName,
    typeLabel,
    project?.microMarket,
    "Mumbai real estate",
  ].filter(Boolean) as string[];

  const base: GeneratedArticlePayload = {
    title,
    seoTitle: title.slice(0, 60),
    seoDescription: intro.slice(0, 155),
    slug,
    featuredSummary: intro.slice(0, 280),
    tableOfContents: toc,
    introduction: intro,
    sections,
    faqs,
    callToAction: `Interested in ${subject}? Request a site visit or download the brochure to compare configurations and payment plans.`,
    relatedProjects: project?.slug ? [project.slug] : [],
    relatedBuilders: builder?.slug ? [builder.slug] : [],
    relatedLocalities: locality?.slug ? [locality.slug] : [],
    imageSuggestions: [
      {
        type: "featured",
        prompt: `Modern residential tower exterior of ${subject} in ${locationName}, golden hour, professional real estate photography`,
        altText: `${subject} exterior view in ${locationName}`,
      },
    ],
    imagePrompts: [
      `Aerial view of ${locationName} skyline with residential towers`,
      `Luxury apartment living room interior, warm lighting`,
    ],
    schemaData: {},
    internalLinks: [],
    externalReferences: builder?.website
      ? [{ label: `${builderName} official website`, url: builder.website }]
      : [],
    socialCaption: `🏠 ${typeLabel}: ${subject} in ${locationName} by ${builderName}. ${formatPrice(project?.priceMin, project?.priceMax)} #MumbaiRealEstate`,
    newsletterSummary: `${typeLabel} for ${subject} — pricing, amenities, and location insights for ${locationName}.`,
    keywords,
    seoAnalysis: { keywordDensity: {}, readabilityScore: 0, seoScore: 0, issues: [], recommendations: [] },
  };

  return base;
}

export const contentGenerationService = {
  async generate(
    context: ContentSourceContext,
    contentType: ContentType
  ): Promise<GeneratedArticlePayload> {
    if (llmService.isConfigured() && context.project) {
      try {
        return await this.generateWithAi(context, contentType);
      } catch {
        // Fall through to template generation
      }
    }
    const article = buildTemplateArticle(context, contentType);
    const enriched = await internalLinkingService.enrichLinks(article, context);
    enriched.seoAnalysis = seoEngineService.analyze(enriched);
    enriched.schemaData = seoEngineService.buildArticleSchema(enriched, context);
    return enriched;
  },

  async generateWithAi(
    context: ContentSourceContext,
    contentType: ContentType
  ): Promise<GeneratedArticlePayload> {
    const typeLabel = CONTENT_TYPE_LABELS[contentType];
    const systemPrompt = `You are an expert real estate SEO content writer for Mumbai property market. Generate factual, structured content from provided data only. Do not invent RERA numbers or prices. Return valid JSON matching the schema.`;

    const userPrompt = JSON.stringify({
      contentType: typeLabel,
      context,
      requiredFields: [
        "title", "seoTitle", "seoDescription", "slug", "featuredSummary",
        "tableOfContents", "introduction", "sections", "faqs", "callToAction",
        "relatedProjects", "relatedBuilders", "relatedLocalities",
        "imageSuggestions", "imagePrompts", "socialCaption", "newsletterSummary", "keywords",
      ],
    });

    const raw = await llmService.completeJson<GeneratedArticlePayload>(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.6, maxTokens: 4096 }
    );

    const enriched = await internalLinkingService.enrichLinks(raw, context);
    enriched.seoAnalysis = seoEngineService.analyze(enriched);
    enriched.schemaData = seoEngineService.buildArticleSchema(enriched, context);
    return enriched;
  },

  buildTemplate(context: ContentSourceContext, contentType: ContentType) {
    const article = buildTemplateArticle(context, contentType);
    article.seoAnalysis = seoEngineService.analyze(article);
    article.schemaData = seoEngineService.buildArticleSchema(article, context);
    return article;
  },
};
