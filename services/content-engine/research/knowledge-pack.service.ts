import type { ContentType, FactConfidenceLevel } from "@/config/content-engine";
import type { ContentFaq } from "@/types/content-engine";
import type {
  KnowledgePack,
  InternalResearchData,
  ExternalResearchData,
  VerifiedFact,
  KeyNumber,
  NearbyInfrastructure,
  ResearchSource,
} from "@/types/content-research";

function fact(
  key: string,
  label: string,
  value: string | undefined | null,
  confidence: FactConfidenceLevel,
  source: ResearchSource
): VerifiedFact | null {
  if (!value?.trim()) return null;
  return {
    key,
    label,
    value: value.trim(),
    confidence,
    source,
    requiresReview: confidence === "low",
  };
}

function formatPrice(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) =>
    n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)} Cr` : `₹${(n / 100_000).toFixed(1)} L`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export const knowledgePackService = {
  build(
    contentType: ContentType,
    internal: InternalResearchData,
    external: ExternalResearchData[]
  ): KnowledgePack {
    const internalSource: ResearchSource = {
      type: "internal",
      name: "PropAI Database",
      fetchedAt: new Date().toISOString(),
    };

    const project = internal.project as Record<string, string> | undefined;
    const builder = internal.builder as Record<string, string | number> | undefined;
    const locality = internal.locality as Record<string, string | number> | undefined;
    const pricing = internal.pricing as { min?: number; max?: number; perSqftEstimate?: number };

    const verifiedFacts: VerifiedFact[] = [
      fact("project_name", "Project Name", project?.name, "high", internalSource),
      fact("builder_name", "Builder", builder?.name as string, "high", internalSource),
      fact("location", "Location", project?.locationName ?? (locality?.name as string), "high", internalSource),
      fact("micro_market", "Micro Market", project?.microMarket as string, internal.locality ? "high" : "medium", internalSource),
      fact("rera", "RERA Number", internal.rera, internal.rera ? "high" : "low", internalSource),
      fact("possession", "Possession", internal.possession, internal.possession ? "high" : "low", internalSource),
      fact("status", "Construction Status", internal.constructionStatus, "high", internalSource),
      fact("price_range", "Price Range", formatPrice(pricing?.min, pricing?.max), pricing?.min ? "high" : "low", internalSource),
    ].filter(Boolean) as VerifiedFact[];

    const keyNumbers: KeyNumber[] = [];
    if (pricing?.min) {
      keyNumbers.push({
        metric: "Starting Price",
        value: formatPrice(pricing.min),
        confidence: "high",
      });
    }
    if (pricing?.perSqftEstimate) {
      keyNumbers.push({
        metric: "Avg Price/sqft (locality)",
        value: String(pricing.perSqftEstimate),
        unit: "INR/sqft",
        confidence: "medium",
      });
    }
    if (locality?.investmentScore) {
      keyNumbers.push({
        metric: "Investment Score",
        value: String(locality.investmentScore),
        confidence: "medium",
      });
    }

    const nearbyInfrastructure: NearbyInfrastructure[] = [];
    if (locality?.connectivity) {
      nearbyInfrastructure.push({
        type: "metro",
        name: `${locality.name} connectivity`,
        confidence: "medium",
      });
    }

    const externalSources: ResearchSource[] = external
      .filter((e) => e.available && e.items.length)
      .map((e) => ({
        type: "external" as const,
        name: e.connectorId,
        fetchedAt: e.fetchedAt,
        connectorId: e.connectorId,
      }));

    const seoKeywords = [
      project?.name,
      builder?.name as string,
      project?.locationName ?? (locality?.name as string),
      project?.microMarket as string,
      contentType.replace(/_/g, " "),
      "Mumbai real estate",
    ].filter(Boolean) as string[];

    const faqs: ContentFaq[] = internal.existingFaqs.length
      ? internal.existingFaqs
      : [
          {
            question: `What is the price of ${project?.name}?`,
            answer: formatPrice(pricing?.min, pricing?.max) || "Contact for pricing.",
            order: 1,
          },
        ];

    const pros: string[] = [];
    const cons: string[] = [];

    if (internal.amenities.length >= 5) pros.push(`Wide amenity offering (${internal.amenities.length}+ facilities)`);
    if (internal.rera) pros.push("RERA registered project");
    if (locality?.investmentScore && Number(locality.investmentScore) >= 70) {
      pros.push("Strong investment score for the locality");
    }
    if (internal.dataGaps.includes("rera")) cons.push("RERA number not available in database");
    if (internal.dataGaps.includes("possession")) cons.push("Possession timeline not confirmed");
    if (!internal.configurations.length) cons.push("Configuration details incomplete");

    const lowConfidenceCount = verifiedFacts.filter(
      (f) => f.confidence === "low" || f.requiresReview
    ).length;

    const totalFields = 10;
    const filledFields =
      totalFields - internal.dataGaps.length - (lowConfidenceCount > 3 ? 1 : 0);
    const dataCompleteness = Math.round((filledFields / totalFields) * 100);

    return {
      projectId: project?.id,
      builderId: builder?.id as string | undefined,
      localityId: locality?.id as string | undefined,
      contentType,
      researchedAt: new Date().toISOString(),
      verifiedFacts,
      keyNumbers,
      amenities: internal.amenities,
      timeline: internal.possession
        ? [{ event: "Expected Possession", date: internal.possession, confidence: "high" as const }]
        : [],
      pros,
      cons,
      nearbyInfrastructure,
      importantDistances: nearbyInfrastructure,
      builderInformation: builder
        ? {
            name: String(builder.name),
            website: String(builder.website ?? ""),
            established: String(builder.establishedYear ?? ""),
          }
        : {},
      relatedProjects: internal.relatedProjects,
      competitors: internal.competitors,
      seoKeywords,
      faqs,
      sources: [internalSource, ...externalSources],
      lowConfidenceCount,
      dataCompleteness,
      externalDataAvailable: external.some((e) => e.available),
    };
  },
};
