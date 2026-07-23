import type { FirecrawlScrapeResult } from "@/services/firecrawl/firecrawl.service";
import {
  inferLocalityFromUrl,
  inferProjectSlugFromUrl,
  isProjectSubpageSlug,
  resolveCanonicalProjectUrl,
} from "@/services/extraction/project-url.utils";
import { parseProjectPageWithReport } from "@/services/extraction/parsers";
import { SUPPORTED_BUILDERS } from "@/config/builders";
import { PROJECT_INTELLIGENCE_SPEC_CATEGORIES } from "@/config/project-intelligence";
import type {
  ProjectIntelligenceAiSummary,
  ProjectIntelligenceConfiguration,
  ProjectIntelligenceDownloadLink,
  ProjectIntelligenceMediaItem,
  ProjectIntelligencePossession,
  ProjectIntelligenceProject,
  ProjectIntelligenceReport,
  ProjectIntelligenceSpecification,
  ProjectIntelligenceUpdate,
} from "@/types/project-intelligence";
import { PROJECT_INTELLIGENCE_SCHEMA_VERSION } from "@/types/project-intelligence";

const POSSESSION_PATTERN =
  /(?:possession|handover|completion|ready\s*(?:to\s*move|for\s*possession))[:\s-]*([A-Za-z]+\s*'?\d{2,4}|\d{1,2}[/-]\d{4}|\d{4}|[A-Za-z]+\s+\d{4})/gi;
const REVISED_POSSESSION_PATTERN =
  /revised\s+possession[:\s-]*([A-Za-z]+\s*'?\d{2,4}|\d{1,2}[/-]\d{4}|\d{4}|[A-Za-z]+\s+\d{4})/gi;
const OC_PATTERN = /(?:occupancy\s*certificate|OC)[:\s-]*(received|approved|pending|applied|not\s*received|awaited)/gi;
const CC_PATTERN = /(?:completion\s*certificate|CC)[:\s-]*(received|approved|pending|applied|not\s*received|awaited)/gi;
const COMPLETION_PERCENT = /(\d{1,3})\s*%\s*(?:complete|completed|construction)/gi;
const TOWER_COUNT = /(\d+)\s+towers?/gi;
const FLOOR_COUNT = /(\d+)\s+floors?/gi;
const UNIT_COUNT = /(\d+)\s+(?:units|apartments|homes|flats)/gi;
const TOWER_POSSESSION =
  /(?:tower|wing|phase)\s*([A-Za-z0-9-]+)[:\s-]+(?:possession|handover)[:\s-]*([A-Za-z]+\s*'?\d{2,4}|\d{4}|[A-Za-z]+\s+\d{4})/gi;
const PHONE_PATTERN = /(?:\+91[\s-]?)?[6-9]\d{9}/g;
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const VIDEO_PATTERN = /https?:\/\/[^\s"'<>]+(?:youtube\.com|youtu\.be|vimeo\.com)[^\s"'<>]*/gi;
const VIRTUAL_TOUR = /https?:\/\/[^\s"'<>]+(?:virtual|tour|walkthrough|matterport)[^\s"'<>]*/gi;
const PDF_PATTERN = /https?:\/\/[^\s"'<>]+\.pdf[^\s"'<>]*/gi;

function mergeContent(scrapes: FirecrawlScrapeResult[]): string {
  return scrapes
    .map((s) => [s.markdown, s.html].filter(Boolean).join("\n"))
    .join("\n\n---PAGE---\n\n");
}

function firstMatchAll(pattern: RegExp, text: string): string[] {
  const results: string[] = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[1]) results.push(match[1].trim());
  }
  return results;
}

function inferBuilderName(url: string, content: string): string | undefined {
  const host = new URL(url).hostname.replace(/^www\./, "");
  for (const builder of SUPPORTED_BUILDERS) {
    try {
      const builderHost = new URL(builder.website).hostname.replace(/^www\./, "");
      if (host.includes(builderHost.replace(/^www\./, "")) || content.includes(builder.name)) {
        return builder.name;
      }
    } catch {
      // ignore invalid builder website
    }
  }
  const titleCase = host.split(".")[0];
  return titleCase ? titleCase.charAt(0).toUpperCase() + titleCase.slice(1) : undefined;
}

function classifyMediaUrl(url: string): ProjectIntelligenceMediaItem["type"] {
  const lower = url.toLowerCase();
  if (/floor.?plan|layout|bed/i.test(lower)) return "floor_plan";
  if (/master.?plan|site.?plan/i.test(lower)) return "master_plan";
  if (/amenit|pool|gym|club/i.test(lower)) return "amenity";
  if (/exterior|facade|elevation/i.test(lower)) return "exterior";
  if (/interior|living|kitchen|bedroom/i.test(lower)) return "interior";
  if (/brochure|ebrochure/i.test(lower)) return "brochure";
  return "project";
}

function extractMedia(scrapes: FirecrawlScrapeResult[]): ProjectIntelligenceMediaItem[] {
  const items: ProjectIntelligenceMediaItem[] = [];
  const seen = new Set<string>();

  for (const scrape of scrapes) {
    const candidates = [
      ...(scrape.images ?? []),
      ...(scrape.links ?? []).filter((l) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(l)),
    ];

    for (const href of candidates) {
      try {
        const url = new URL(href, scrape.url).href;
        if (seen.has(url) || /logo|icon|svg|close\.|enquire|call\.|chat\./i.test(url)) continue;
        seen.add(url);
        items.push({
          url,
          type: classifyMediaUrl(url),
          sourceUrl: scrape.url,
        });
      } catch {
        // skip invalid URLs
      }
    }
  }

  return items;
}

function extractDownloads(scrapes: FirecrawlScrapeResult[]): ProjectIntelligenceDownloadLink[] {
  const downloads: ProjectIntelligenceDownloadLink[] = [];
  const seen = new Set<string>();

  for (const scrape of scrapes) {
    const content = [scrape.markdown, scrape.html].filter(Boolean).join("\n");
    for (const match of content.matchAll(PDF_PATTERN)) {
      const url = match[0];
      if (seen.has(url)) continue;
      seen.add(url);
      const lower = url.toLowerCase();
      let type: ProjectIntelligenceDownloadLink["type"] = "other";
      let label = "Document";
      if (/brochure|ebrochure/i.test(lower)) {
        type = "brochure";
        label = "Brochure";
      } else if (/price|rate/i.test(lower)) {
        type = "price_list";
        label = "Price List";
      } else if (/floor|layout|plan/i.test(lower)) {
        type = "floor_plan";
        label = "Floor Plan";
      } else if (/master/i.test(lower)) {
        type = "master_plan";
        label = "Master Plan";
      } else if (/payment/i.test(lower)) {
        type = "payment_plan";
        label = "Payment Plan";
      }
      downloads.push({ label, url, type });
    }
  }

  return downloads;
}

function extractSpecifications(
  scrapes: FirecrawlScrapeResult[]
): ProjectIntelligenceSpecification[] {
  const merged = mergeContent(scrapes);
  const specs: ProjectIntelligenceSpecification[] = [];

  for (const category of PROJECT_INTELLIGENCE_SPEC_CATEGORIES) {
    const pattern = new RegExp(
      `${category}[:\\s-]+([^\\n#]+(?:\\n(?!#{1,3}\\s)[^\\n]+)*)`,
      "i"
    );
    const match = merged.match(pattern);
    if (match?.[1]) {
      const details = match[1]
        .split(/\n|•|·|-/)
        .map((line) => line.trim())
        .filter((line) => line.length > 3 && line.length < 200);
      if (details.length) {
        specs.push({ category, details: details.slice(0, 12) });
      }
    }
  }

  return specs;
}

function extractConfigurationsFromContent(
  content: string,
  sourceUrl: string
): ProjectIntelligenceConfiguration[] {
  const configs: ProjectIntelligenceConfiguration[] = [];
  const bhkBlocks = [...content.matchAll(/(\d)\s*BHK[^\n]{0,200}/gi)];

  for (const match of bhkBlocks) {
    const block = match[0];
    const bhk = `${match[1]} BHK`;
    const carpet = block.match(/(\d{2,5})\s*(?:sq\.?\s*ft|sqft)/i)?.[0];
    const facing = block.match(/(?:facing)[:\s-]*([A-Za-z-]+)/i)?.[1];
    configs.push({
      configuration: bhk,
      carpetArea: carpet,
      facing,
      sourceUrl,
    });
  }

  return configs;
}

function extractUpdates(scrapes: FirecrawlScrapeResult[]): ProjectIntelligenceUpdate[] {
  const updates: ProjectIntelligenceUpdate[] = [];
  const patterns = [
    { category: "construction", re: /construction\s+(?:update|progress)[:\s-]*([^\n]+)/gi },
    { category: "possession", re: /possession\s+(?:update|timeline)[:\s-]*([^\n]+)/gi },
    { category: "announcement", re: /(?:announcement|notice)[:\s-]*([^\n]+)/gi },
    { category: "news", re: /(?:latest\s+news|news)[:\s-]*([^\n]+)/gi },
  ];

  for (const scrape of scrapes) {
    const content = scrape.markdown ?? "";
    for (const { category, re } of patterns) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(re.source, re.flags);
      while ((match = regex.exec(content)) !== null) {
        updates.push({
          title: match[0].slice(0, 120),
          summary: match[1]?.trim().slice(0, 300),
          category,
          sourceUrl: scrape.url,
        });
      }
    }
  }

  return updates.slice(0, 20);
}

function buildPossessionIntelligence(
  content: string,
  expectedFromParser?: string
): ProjectIntelligencePossession {
  const expected =
    expectedFromParser ?? firstMatchAll(POSSESSION_PATTERN, content)[0];
  const revised = firstMatchAll(REVISED_POSSESSION_PATTERN, content)[0];
  const oc = firstMatchAll(OC_PATTERN, content)[0];
  const cc = firstMatchAll(CC_PATTERN, content)[0];
  const completionMatch = [...content.matchAll(COMPLETION_PERCENT)][0];
  const completionPercent = completionMatch
    ? parseInt(completionMatch[1], 10)
    : undefined;

  const towerWise: ProjectIntelligencePossession["towerWisePossession"] = [];
  let towerMatch: RegExpExecArray | null;
  const towerRe = new RegExp(TOWER_POSSESSION.source, TOWER_POSSESSION.flags);
  while ((towerMatch = towerRe.exec(content)) !== null) {
    towerWise.push({
      tower: towerMatch[1],
      possession: towerMatch[2],
    });
  }

  let aiEstimatedMarketingStartDate: string | undefined;
  let aiConfidenceScore = 0.35;

  if (expected || revised) {
    aiConfidenceScore = 0.72;
    aiEstimatedMarketingStartDate =
      "6–9 months before stated possession (rule-based estimate from public data)";
  } else if (completionPercent && completionPercent >= 80) {
    aiConfidenceScore = 0.55;
    aiEstimatedMarketingStartDate =
      "Near-term — construction appears advanced based on published completion %";
  }

  return {
    expectedPossession: expected,
    revisedPossession: revised,
    towerWisePossession: towerWise,
    phaseWisePossession: [],
    ocStatus: oc,
    ccStatus: cc,
    constructionCompletionPercent: completionPercent,
    aiEstimatedMarketingStartDate,
    aiConfidenceScore,
  };
}

function buildFactualAiSummary(
  project: ProjectIntelligenceProject,
  possession: ProjectIntelligencePossession,
  amenities: string[],
  configurations: ProjectIntelligenceConfiguration[],
  media: ProjectIntelligenceMediaItem[],
  downloads: ProjectIntelligenceDownloadLink[]
): ProjectIntelligenceAiSummary {
  const missing: string[] = [];
  if (!project.reraNumber) missing.push("RERA registration number");
  if (!project.expectedPossession && !possession.expectedPossession) {
    missing.push("Expected possession timeline");
  }
  if (!configurations.length) missing.push("Unit configurations");
  if (!amenities.length) missing.push("Amenities list");
  if (!media.some((m) => m.type === "floor_plan")) missing.push("Floor plans");
  if (!downloads.some((d) => d.type === "brochure")) missing.push("Brochure download");

  const presentFields = [
    project.projectName,
    project.builder,
    project.microLocation,
    project.reraNumber,
    possession.expectedPossession,
    configurations.length ? "configs" : "",
    amenities.length ? "amenities" : "",
    media.length ? "media" : "",
  ].filter(Boolean).length;

  const confidenceScore = Math.min(
    0.95,
    Math.round((presentFields / 8) * 100) / 100
  );

  const possessionStatus = possession.expectedPossession
    ? `Expected possession: ${possession.expectedPossession}${
        possession.revisedPossession ? ` (revised: ${possession.revisedPossession})` : ""
      }`
    : possession.constructionCompletionPercent
      ? `Construction approximately ${possession.constructionCompletionPercent}% complete (from public page text)`
      : "Possession timeline not clearly published on crawled pages";

  return {
    projectOverview: [
      project.projectName && `${project.projectName}`,
      project.builder && `by ${project.builder}`,
      project.microLocation && `in ${project.microLocation}`,
      project.city && project.city,
    ]
      .filter(Boolean)
      .join(" "),
    keyHighlights: [
      project.reraNumber ? `RERA: ${project.reraNumber}` : "",
      configurations.length
        ? `Configurations: ${configurations.map((c) => c.configuration).join(", ")}`
        : "",
      amenities.length ? `${amenities.length} amenities identified` : "",
      media.length ? `${media.length} media assets extracted` : "",
      downloads.length ? `${downloads.length} downloadable documents found` : "",
    ].filter(Boolean),
    possessionStatus,
    marketingReadiness:
      confidenceScore >= 0.7
        ? "Moderate–high — sufficient public data for owner marketing research"
        : confidenceScore >= 0.45
          ? "Partial — core facts present; fill gaps before owner campaigns"
          : "Low — significant public data missing on crawled pages",
    recommendedOwnerMarketingTimeline:
      possession.aiEstimatedMarketingStartDate ??
      "Begin owner outreach once possession timeline is confirmed with builder",
    importantMissingInformation: missing,
    confidenceScore,
  };
}

export function buildProjectIntelligenceReport(input: {
  sourceUrl: string;
  scrapes: FirecrawlScrapeResult[];
  durationMs: number;
  crawlStatus: ProjectIntelligenceReport["meta"]["crawlStatus"];
  errors: string[];
  warnings: string[];
  firecrawlConfigured: boolean;
}): ProjectIntelligenceReport {
  const canonicalUrl = resolveCanonicalProjectUrl(input.sourceUrl);
  const mainScrape =
    input.scrapes.find(
      (s) => resolveCanonicalProjectUrl(s.url) === canonicalUrl
    ) ?? input.scrapes[0];

  const builderGuess =
    SUPPORTED_BUILDERS.find((b) => {
      try {
        return new URL(input.sourceUrl).hostname.includes(
          new URL(b.website).hostname.replace(/^www\./, "")
        );
      } catch {
        return false;
      }
    }) ?? SUPPORTED_BUILDERS[0];

  const coreExtraction = parseProjectPageWithReport({
    url: mainScrape?.url ?? canonicalUrl,
    markdown: mainScrape?.markdown,
    html: mainScrape?.html,
    metadata: mainScrape?.metadata,
    links: mainScrape?.links,
    images: mainScrape?.images,
    builderName: builderGuess.name,
    builderWebsite: builderGuess.website,
  });

  const merged = mergeContent(input.scrapes);
  const media = extractMedia(input.scrapes);
  const downloads = extractDownloads(input.scrapes);
  const specifications = extractSpecifications(input.scrapes);
  const updates = extractUpdates(input.scrapes);

  const configsFromParser = coreExtraction.facts.configurations.map((c) => ({
    configuration: c.configurationName,
    carpetArea: c.carpetArea
      ? `${c.carpetArea.min}${c.carpetArea.unit === "sqft" ? " sq.ft." : ""}`
      : undefined,
    sourceUrl: canonicalUrl,
  }));

  const configsFromContent = extractConfigurationsFromContent(
    merged,
    canonicalUrl
  );

  const configurations = configsFromParser.length
    ? configsFromParser
    : configsFromContent;

  const amenitiesFlat = Object.values(coreExtraction.facts.amenities).flat();
  const locationFromParser = (coreExtraction.facts.nearbyPlaces ?? []).map(
    (p) => ({
      type: p.type,
      name: p.name,
      distance: p.distance,
      sourceUrl: canonicalUrl,
    })
  );

  const possession = buildPossessionIntelligence(
    merged,
    coreExtraction.facts.possessionDate
  );

  const project: ProjectIntelligenceProject = {
    projectName: coreExtraction.facts.projectName,
    builder: coreExtraction.facts.builderName ?? inferBuilderName(input.sourceUrl, merged),
    address: firstMatchAll(
      /(?:address|sales?\s*office)[:\s-]+([^\n]+)/gi,
      merged
    )[0],
    microLocation:
      coreExtraction.facts.microMarket ??
      inferLocalityFromUrl(canonicalUrl) ??
      coreExtraction.facts.location,
    city: /\bMumbai\b/i.test(merged) ? "Mumbai" : undefined,
    state: /\bMaharashtra\b/i.test(merged) ? "Maharashtra" : undefined,
    latitude: coreExtraction.facts.latitude,
    longitude: coreExtraction.facts.longitude,
    reraNumber: coreExtraction.facts.reraNumber,
    projectStatus: coreExtraction.facts.status,
    launchDate: coreExtraction.facts.launchDate,
    expectedPossession: possession.expectedPossession,
    revisedPossession: firstMatchAll(REVISED_POSSESSION_PATTERN, merged)[0],
    currentPhase: firstMatchAll(/phase\s*([A-Za-z0-9-]+)/gi, merged)[0],
    constructionStage: coreExtraction.facts.constructionStage,
    towerCount: parseInt(firstMatchAll(TOWER_COUNT, merged)[0] ?? "", 10) || undefined,
    floorCount: parseInt(firstMatchAll(FLOOR_COUNT, merged)[0] ?? "", 10) || undefined,
    unitCount: parseInt(firstMatchAll(UNIT_COUNT, merged)[0] ?? "", 10) || undefined,
  };

  if (!project.projectName && inferProjectSlugFromUrl(canonicalUrl)) {
    project.projectName = inferProjectSlugFromUrl(canonicalUrl)!
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const videos = [...merged.matchAll(VIDEO_PATTERN)].map((m) => m[0]);
  const virtualTours = [...merged.matchAll(VIRTUAL_TOUR)].map((m) => m[0]);
  const phones = [...merged.matchAll(PHONE_PATTERN)].map((m) => m[0]);
  const emails = [...merged.matchAll(EMAIL_PATTERN)].map((m) => m[0]);

  const floorPlanCount = media.filter((m) => m.type === "floor_plan").length;

  const aiSummary = buildFactualAiSummary(
    project,
    possession,
    amenitiesFlat,
    configurations,
    media,
    downloads
  );

  return {
    meta: {
      schemaVersion: PROJECT_INTELLIGENCE_SCHEMA_VERSION,
      sourceUrl: input.sourceUrl,
      canonicalUrl,
      extractedAt: new Date().toISOString(),
      durationMs: input.durationMs,
      crawlStatus: input.crawlStatus,
      pagesCrawled: input.scrapes.length,
      pagesAttempted: input.scrapes.map((s) => s.url),
      imageCount: media.length,
      floorPlanCount,
      extractionConfidence: aiSummary.confidenceScore,
      firecrawlConfigured: input.firecrawlConfigured,
      errors: input.errors,
      warnings: input.warnings,
    },
    project,
    projectUpdates: updates,
    possession,
    configurations,
    specifications,
    amenities: [...new Set(amenitiesFlat.map((a) => a.trim()))].filter(Boolean),
    location: locationFromParser,
    media,
    downloads,
    videos: [...new Set(videos)],
    virtualTours: [...new Set(virtualTours)],
    contact: {
      builderWebsite: builderGuess.website,
      salesOffice: project.address,
      phone: phones[0],
      email: emails[0],
      sourceUrl: canonicalUrl,
    },
    aiSummary,
    rawPageSummaries: input.scrapes.map((s) => ({
      url: s.url,
      title: String(s.metadata?.title ?? ""),
      markdownLength: s.markdown?.length ?? 0,
    })),
  };
}

export function discoverProjectSubpages(
  links: string[] | undefined,
  canonicalUrl: string
): string[] {
  const base = resolveCanonicalProjectUrl(canonicalUrl).replace(/\/$/, "");
  const subpages = new Set<string>();

  for (const link of links ?? []) {
    try {
      const href = new URL(link, base).href.replace(/\/$/, "");
      if (!href.startsWith(base) || href === base) continue;
      const remainder = href.slice(base.length);
      const segment = remainder.split("/").filter(Boolean)[0];
      if (segment && isProjectSubpageSlug(segment)) {
        subpages.add(`${base}/${segment}`);
      }
    } catch {
      // skip invalid link
    }
  }

  return [...subpages];
}
