import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { KnowledgePack } from "@/types/content-research";
import type {
  GeneratedArticlePayload,
  ContentSection,
  ContentTocItem,
} from "@/types/content-engine";
import { slugify } from "@/lib/utils";
import { llmService } from "@/services/content-engine/ai/llm.service";
import { seoEngineService } from "@/services/content-engine/seo/seo-engine.service";
import { internalLinkingService } from "@/services/content-engine/seo/internal-linking.service";
import { contentSourceRegistry } from "@/services/content-engine/sources/content-source.registry";
import type { ContentSourceContext } from "@/types/content-engine";

function getFact(pack: KnowledgePack, key: string): string | undefined {
  return pack.verifiedFacts.find((f) => f.key === key)?.value;
}

function buildFromKnowledgePack(
  pack: KnowledgePack,
  context: ContentSourceContext
): GeneratedArticlePayload {
  const typeLabel = CONTENT_TYPE_LABELS[pack.contentType];
  const projectName = getFact(pack, "project_name") ?? "Property";
  const builderName = getFact(pack, "builder_name") ?? "Developer";
  const locationName = getFact(pack, "location") ?? "Mumbai";
  const slug = slugify(`${projectName}-${typeLabel}`);

  const sections: ContentSection[] = [
    {
      id: "overview",
      heading: `${projectName} Overview`,
      body: `${projectName} by ${builderName} in ${locationName}. ${pack.pros.join(". ")}.`,
      order: 1,
    },
    {
      id: "pricing",
      heading: "Pricing & Key Numbers",
      body: `${getFact(pack, "price_range") ?? "Price on request"}. ${pack.keyNumbers.map((k) => `${k.metric}: ${k.value}`).join(". ")}.`,
      order: 2,
    },
    {
      id: "amenities",
      heading: "Amenities",
      body: pack.amenities.length
        ? `Amenities include ${pack.amenities.join(", ")}.`
        : "Amenity details being updated.",
      order: 3,
    },
    {
      id: "location",
      heading: "Location & Connectivity",
      body: pack.nearbyInfrastructure.length
        ? pack.nearbyInfrastructure.map((n) => `${n.name} (${n.type})`).join(". ")
        : `Located in ${locationName}${getFact(pack, "micro_market") ? `, ${getFact(pack, "micro_market")}` : ""}.`,
      order: 4,
    },
  ];

  if (pack.cons.length) {
    sections.push({
      id: "considerations",
      heading: "Buyer Considerations",
      body: pack.cons.join(". "),
      order: 5,
    });
  }

  const toc: ContentTocItem[] = sections.map((s) => ({
    id: s.id,
    label: s.heading,
    level: 2,
  }));

  const intro = `Research-backed ${typeLabel.toLowerCase()} for ${projectName}. Data completeness: ${pack.dataCompleteness}%. ${pack.lowConfidenceCount} fact(s) flagged for review.`;

  return {
    title: `${projectName}: ${typeLabel} | ${locationName}`,
    seoTitle: `${projectName} ${typeLabel}`.slice(0, 60),
    seoDescription: intro.slice(0, 155),
    slug,
    featuredSummary: intro.slice(0, 280),
    tableOfContents: toc,
    introduction: intro,
    sections,
    faqs: pack.faqs,
    callToAction: `Explore ${projectName} — request details or schedule a site visit.`,
    relatedProjects: pack.relatedProjects.map((p) => p.slug),
    relatedBuilders: pack.builderInformation.name
      ? [context.builder?.slug ?? ""].filter(Boolean)
      : [],
    relatedLocalities: pack.localityId ? [context.locality?.slug ?? ""].filter(Boolean) : [],
    imageSuggestions: [
      {
        type: "featured",
        prompt: `Professional real estate photo of ${projectName}, ${locationName}`,
        altText: `${projectName} — ${typeLabel}`,
      },
    ],
    imagePrompts: [`${locationName} skyline`, `${projectName} amenity view`],
    schemaData: {},
    internalLinks: [],
    externalReferences: pack.sources
      .filter((s) => s.url)
      .map((s) => ({ label: s.name, url: s.url! })),
    socialCaption: `${typeLabel}: ${projectName} in ${locationName} #MumbaiRealEstate`,
    newsletterSummary: intro.slice(0, 200),
    keywords: pack.seoKeywords,
    seoAnalysis: { keywordDensity: {}, readabilityScore: 0, seoScore: 0, issues: [], recommendations: [] },
  };
}

export const knowledgePackGenerationService = {
  async generateFromPack(
    pack: KnowledgePack,
    projectId: string
  ): Promise<GeneratedArticlePayload> {
    const context = await contentSourceRegistry.loadFromProject(projectId);
    if (!context) throw new Error("Failed to load source context");

    if (llmService.isConfigured()) {
      try {
        return await this.generateWithAi(pack, context);
      } catch {
        // fallback
      }
    }

    const article = buildFromKnowledgePack(pack, context);
    const enriched = await internalLinkingService.enrichLinks(article, context);
    enriched.seoAnalysis = seoEngineService.analyze(enriched);
    enriched.schemaData = seoEngineService.buildArticleSchema(enriched, context);
    return enriched;
  },

  async generateWithAi(pack: KnowledgePack, context: ContentSourceContext) {
    const typeLabel = CONTENT_TYPE_LABELS[pack.contentType];
    const systemPrompt = `You are an expert real estate content writer. Write ONLY from the provided Knowledge Pack. Do not invent facts. Flag uncertain data in prose cautiously. Return valid JSON.`;

    const raw = await llmService.completeJson<GeneratedArticlePayload>(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            contentType: typeLabel,
            knowledgePack: pack,
            instruction: "Generate article from knowledge pack only",
          }),
        },
      ],
      { temperature: 0.5, maxTokens: 4096 }
    );

    const enriched = await internalLinkingService.enrichLinks(raw, context);
    enriched.seoAnalysis = seoEngineService.analyze(enriched);
    enriched.schemaData = seoEngineService.buildArticleSchema(enriched, context);
    return enriched;
  },
};
