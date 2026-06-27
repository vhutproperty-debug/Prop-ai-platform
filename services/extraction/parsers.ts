import type {
  ExtractedBuilderFacts,
  ExtractedConfiguration,
  ExtractedProjectFacts,
  ExtractionFieldReport,
  ProjectPageExtractionResult,
} from "@/types/firecrawl-import";
import {
  generateProjectSlug,
} from "@/lib/normalizers/helpers";
import {
  dedupeCanonicalProjectUrls,
  inferLocalityFromUrl,
  inferProjectSlugFromUrl,
  isLikelyProjectDetailUrl,
  resolveCanonicalProjectUrl,
  selectPrimaryProjectUrl,
} from "@/services/extraction/project-url.utils";

const RERA_SLASH_PATTERN =
  /(?:RERA|MahaRERA|MAHARERA)[:\s#-]*([A-Z]{2,4}\/[A-Z]+\/\d{4}\/\d+(?:\/[A-Z0-9]+)?)/gi;
const RERA_P_SERIES_PATTERN = /\b(P\d{11,})\b/gi;
const RERA_BLOCK_PATTERN =
  /MahaRERA registration numbers?:?\s*([A-Z0-9,\s|]+)/i;
const BHK_PATTERN = /(\d)\s*(?:BHK|bhk)/gi;
const SQFT_PATTERN = /(\d{2,5})\s*(?:sq\.?\s*ft|sqft|square\s*feet)/gi;
const PRICE_CR_PATTERN =
  /(?:₹|Rs\.?\s*|INR\s*)([\d,.]+)\s*(?:Cr|CR|crore)\b/gi;
const PRICE_LAKH_PATTERN =
  /(?:₹|Rs\.?\s*|INR\s*)([\d,.]+)\s*(?:Lakh|Lac|L)\b/gi;
const PRICE_PER_SQFT =
  /(?:₹|Rs\.?\s*)([\d,]+)\s*(?:per|\/)\s*sq\.?\s*ft\b/gi;
const POSSESSION_PATTERN =
  /(?:possession|handover|completion)[:\s]*([A-Za-z]+\s*\d{4}|\d{1,2}[/-]\d{4}|\d{4})/gi;
const LAUNCH_PATTERN =
  /(?:launch(?:ed)?|launched\s*on)[:\s]*([A-Za-z]+\s*\d{4}|\d{1,2}[/-]\d{4}|\d{4})/gi;
const LAT_LNG_PATTERN = /(-?\d{1,2}\.\d{4,})[,\s]+(-?\d{1,3}\.\d{4,})/g;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(([^)]+)\)/g;
const HTML_IMAGE = /<img[^>]+src=["']([^"']+)["']/gi;
const PDF_LINK = /href=["']([^"']+\.pdf[^"']*)["']/gi;
const FAQ_PATTERN =
  /(?:Q[:\.]?\s*|Question[:\s]*)([^\n?]+\?)\s*(?:A[:\.]?\s*|Answer[:\s]*)([^\n]+)/gi;

const AMENITY_CATEGORIES: Record<string, RegExp[]> = {
  Sports: [/swimming|tennis|badminton|squash|cricket|sports/i],
  Kids: [/kids|children|play\s*area|playground|creche/i],
  Clubhouse: [/clubhouse|club\s*house|community\s*hall|banquet/i],
  Wellness: [/gym|spa|yoga|wellness|fitness|jogging/i],
  Security: [/security|cctv|gated|intercom|24\s*hour/i],
  Landscape: [/garden|landscape|green|podium|jogging\s*track|park/i],
};

const NEARBY_PATTERNS: Record<string, RegExp> = {
  metro: /metro|subway/i,
  school: /school|college|university/i,
  hospital: /hospital|clinic|medical/i,
  mall: /mall|shopping/i,
  airport: /airport/i,
  railway: /railway|station/i,
};

function parseIndianPrice(value: string, unit: "cr" | "lakh"): number {
  const num = parseFloat(value.replace(/,/g, ""));
  return unit === "cr" ? num * 10_000_000 : num * 100_000;
}

function firstMatch(pattern: RegExp, text: string): string | undefined {
  const re = new RegExp(pattern.source, pattern.flags);
  const match = re.exec(text);
  return match?.[1]?.trim();
}

function allMatches(pattern: RegExp, text: string): string[] {
  const results: string[] = [];
  const re = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match[1]) results.push(match[1].trim());
  }
  return results;
}

function extractImages(content: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  for (const pattern of [MARKDOWN_IMAGE, HTML_IMAGE]) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const url = resolveUrl(match[1], baseUrl);
      if (url && !url.includes("icon") && !url.includes("logo.svg")) {
        urls.add(url);
      }
    }
  }
  return [...urls];
}

function resolveUrl(href: string, base: string): string | undefined {
  try {
    return new URL(href, base).href;
  } catch {
    return undefined;
  }
}

function reportField(
  field: string,
  value: string | number | boolean | string[] | null | undefined,
  source: string
): ExtractionFieldReport {
  const normalized =
    value === undefined || value === null || value === ""
      ? null
      : Array.isArray(value)
        ? value.length
          ? value
          : null
        : value;
  return {
    field,
    value: normalized,
    source,
    present: normalized !== null && !(Array.isArray(normalized) && !normalized.length),
  };
}

function cleanProjectTitle(value: string): string {
  return value
    .replace(/\s*(?:[-–|]\s*(?:Lodha|Godrej|Oberoi|Rustomjee|Kalpataru|Runwal|Sunteck|Shapoorji).*)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferProjectName(
  url: string,
  metadata?: Record<string, unknown>,
  content?: string
): { name: string; source: string } {
  const title = String(metadata?.title ?? metadata?.ogTitle ?? "").trim();
  const canonicalUrl = resolveCanonicalProjectUrl(url);

  if (title) {
    const colonSubpage = title.match(
      /^(.+?)\s+(?:Gallery|Amenities|Location|Plans|Prices|About|Floor Plan)\b/i
    );
    if (colonSubpage?.[1]) {
      const name = cleanProjectTitle(colonSubpage[1]);
      if (name.length >= 3) return { name, source: "metadata.title.subpage-prefix" };
    }

    const dashSplit = title.match(/^(.+?)\s*[-–]\s+/);
    if (dashSplit?.[1]) {
      const name = cleanProjectTitle(dashSplit[1]);
      if (name.length >= 3 && !/^(gallery|amenities|location|plans|404)$/i.test(name)) {
        return { name, source: "metadata.title.before-dash" };
      }
    }

    const pipeSplit = title.split("|")[0]?.trim();
    if (pipeSplit && pipeSplit.length >= 3) {
      const name = cleanProjectTitle(pipeSplit.split(/[-–]/)[0]?.trim() ?? pipeSplit);
      if (name.length >= 3 && !/^(gallery|404)$/i.test(name)) {
        return { name, source: "metadata.title.before-pipe" };
      }
    }
  }

  if (content) {
    const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (heading && heading.length >= 3 && !/^(gallery|amenities|location|plans)$/i.test(heading)) {
      return { name: heading, source: "markdown.h1" };
    }

    const blockedEarlyHeading =
      /^(?:click here|rera|about|amenities|gallery|location|plans|prices|residential|commercial|mumbai)$/i;

    const earlyName = content
      .split("\n")
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length >= 3 &&
          line.length <= 60 &&
          /^[A-Z][A-Za-z0-9&.'\s-]+$/.test(line) &&
          !blockedEarlyHeading.test(line) &&
          !/^\d+$/.test(line)
      );
    if (earlyName) {
      return { name: earlyName, source: "markdown.early-heading" };
    }
  }

  const slug = inferProjectSlugFromUrl(canonicalUrl);
  if (slug) {
    return {
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      source: "url.canonical-slug",
    };
  }

  const segments = new URL(canonicalUrl).pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "project";
  return {
    name: last.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    source: "url.last-segment",
  };
}

function inferLocation(
  text: string,
  url: string,
  metadata?: Record<string, unknown>
): { value?: string; source: string } {
  const title = String(metadata?.title ?? "");
  const titleMatch = title.match(/\b(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  if (titleMatch?.[1]) {
    return { value: titleMatch[1].trim(), source: "metadata.title.locality" };
  }

  const urlLocality = inferLocalityFromUrl(url);
  if (urlLocality) {
    return { value: urlLocality, source: "url.property-in-segment" };
  }

  const mumbaiAreas =
    /(?:at|in|located\s*(?:at|in)|address)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i;
  const match = firstMatch(mumbaiAreas, text);
  if (match) return { value: match, source: "markdown.location-phrase" };

  if (/\bMumbai\b/i.test(text)) {
    return { value: "Mumbai", source: "markdown.city" };
  }

  return { source: "not-found" };
}

function extractReraNumbers(text: string): { values: string[]; source: string } {
  const numbers = new Set<string>();

  const block = text.match(RERA_BLOCK_PATTERN);
  if (block?.[1]) {
    for (const match of block[1].matchAll(RERA_P_SERIES_PATTERN)) {
      numbers.add(match[1].toUpperCase());
    }
  }

  for (const match of text.matchAll(RERA_P_SERIES_PATTERN)) {
    numbers.add(match[1].toUpperCase());
  }

  for (const match of text.matchAll(RERA_SLASH_PATTERN)) {
    if (match[1]) numbers.add(match[1].toUpperCase());
  }

  const values = [...numbers];
  if (values.length) {
    return {
      values,
      source: block?.[1] ? "markdown.maharera-block" : "markdown.rera-pattern",
    };
  }

  return { values: [], source: "not-found" };
}

function extractConfigurations(text: string): ExtractedConfiguration[] {
  const configs: ExtractedConfiguration[] = [];
  const bhkMatches = [...text.matchAll(BHK_PATTERN)];
  const sqftMatches = [...text.matchAll(SQFT_PATTERN)].map((m) =>
    parseInt(m[1], 10)
  );

  const seen = new Set<number>();
  bhkMatches.forEach((match, idx) => {
    const bhk = parseInt(match[1], 10);
    if (seen.has(bhk)) return;
    seen.add(bhk);

    const carpetArea = sqftMatches[idx] ?? sqftMatches[0];
    configs.push({
      configurationName: `${bhk} BHK`,
      type: `${bhk} BHK`,
      bhk,
      carpetArea: carpetArea
        ? { min: carpetArea, max: carpetArea, unit: "sqft" }
        : undefined,
    });
  });

  if (!configs.length) {
    configs.push({
      configurationName: "2 BHK",
      type: "2 BHK",
      bhk: 2,
    });
  }

  return configs;
}

function extractPrices(text: string): {
  minPrice?: number;
  maxPrice?: number;
  pricePerSqFt?: number;
} {
  const crPrices = [...text.matchAll(PRICE_CR_PATTERN)].map((m) =>
    parseIndianPrice(m[1], "cr")
  );
  const lakhPrices = [...text.matchAll(PRICE_LAKH_PATTERN)].map((m) =>
    parseIndianPrice(m[1], "lakh")
  );
  const allPrices = [...crPrices, ...lakhPrices].filter((p) => p > 0);
  const pricePerSqFt = firstMatch(PRICE_PER_SQFT, text);

  return {
    minPrice: allPrices.length ? Math.min(...allPrices) : undefined,
    maxPrice: allPrices.length ? Math.max(...allPrices) : undefined,
    pricePerSqFt: pricePerSqFt
      ? parseInt(pricePerSqFt.replace(/,/g, ""), 10)
      : undefined,
  };
}

function extractAmenities(text: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [category, patterns] of Object.entries(AMENITY_CATEGORIES)) {
    const found: string[] = [];
    for (const pattern of patterns) {
      const re = new RegExp(pattern.source, "gi");
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        found.push(match[0].trim());
      }
    }
    if (found.length) result[category] = [...new Set(found)];
  }
  return result;
}

function extractNearby(text: string): ExtractedProjectFacts["nearbyPlaces"] {
  const places: NonNullable<ExtractedProjectFacts["nearbyPlaces"]> = [];
  const lines = text.split(/\n|\.|;/);

  for (const line of lines) {
    for (const [type, pattern] of Object.entries(NEARBY_PATTERNS)) {
      if (!pattern.test(line)) continue;
      const distMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|min|minutes)/i);
      places.push({
        type,
        name: line.trim().slice(0, 120),
        distance: distMatch?.[0],
      });
      break;
    }
  }

  return places.slice(0, 20);
}

function extractFaqs(text: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const re = new RegExp(FAQ_PATTERN.source, FAQ_PATTERN.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    faqs.push({
      question: match[1].trim(),
      answer: match[2].trim().slice(0, 2000),
    });
  }
  return faqs.slice(0, 30);
}

function inferStatus(text: string): ExtractedProjectFacts["status"] {
  if (/sold\s*out|fully\s*sold/i.test(text)) return "sold_out";
  if (/ready\s*(?:to\s*move|possession)|oc\s*received/i.test(text)) return "ready";
  if (/upcoming|pre[\s-]?launch|new\s*launch/i.test(text)) return "upcoming";
  return "ongoing";
}

function collectScrapeImages(input: {
  content: string;
  baseUrl: string;
  images?: string[];
  links?: string[];
  metadata?: Record<string, unknown>;
}): string[] {
  const urls = new Set<string>(extractImages(input.content, input.baseUrl));

  for (const href of input.images ?? []) {
    const resolved = resolveUrl(href, input.baseUrl);
    if (resolved) urls.add(resolved);
  }

  for (const href of input.links ?? []) {
    if (!/\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(href)) continue;
    const resolved = resolveUrl(href, input.baseUrl);
    if (resolved) urls.add(resolved);
  }

  const ogImage = input.metadata?.ogImage;
  if (typeof ogImage === "string") {
    const resolved = resolveUrl(ogImage, input.baseUrl);
    if (resolved) urls.add(resolved);
  }

  return [...urls];
}

export function parseProjectPageWithReport(input: {
  url: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  links?: string[];
  images?: string[];
  builderName: string;
  builderWebsite: string;
}): ProjectPageExtractionResult {
  const canonicalUrl = resolveCanonicalProjectUrl(input.url);
  const content = [input.markdown, input.html].filter(Boolean).join("\n");
  const projectNameResult = inferProjectName(
    canonicalUrl,
    input.metadata,
    input.markdown
  );
  const projectName = projectNameResult.name;
  const slug = generateProjectSlug(input.builderName, projectName);
  const prices = extractPrices(content);
  const configurations = extractConfigurations(content);
  const images = collectScrapeImages({
    content,
    baseUrl: canonicalUrl,
    images: input.images,
    links: input.links,
    metadata: input.metadata,
  });
  const pdfLinks: string[] = [];
  const pdfRe = new RegExp(PDF_LINK.source, PDF_LINK.flags);
  let pdfMatch: RegExpExecArray | null;
  while ((pdfMatch = pdfRe.exec(content)) !== null) {
    const resolved = resolveUrl(pdfMatch[1], canonicalUrl);
    if (resolved) pdfLinks.push(resolved);
  }

  const latLng = [...content.matchAll(LAT_LNG_PATTERN)][0];
  const amenities = extractAmenities(content);
  const flatAmenities = Object.values(amenities).flat();
  const locationResult = inferLocation(content, canonicalUrl, input.metadata);
  const reraResult = extractReraNumbers(content);
  const reraNumber = reraResult.values.join(", ");

  configurations.forEach((config) => {
    const bhkKey = config.bhk ? `${config.bhk}bhk` : "";
    const floorPlan = images.find((img) =>
      bhkKey ? img.toLowerCase().includes(bhkKey) : false
    );
    const floorPdf = pdfLinks.find((pdf) =>
      bhkKey ? pdf.toLowerCase().includes(bhkKey) : false
    );
    if (floorPlan) config.floorPlanImage = floorPlan;
    if (floorPdf) config.floorPlanPdf = floorPdf;
  });

  const facts: ExtractedProjectFacts = {
    projectName,
    slug,
    builderName: input.builderName,
    microMarket: locationResult.value,
    location: locationResult.value,
    latitude: latLng ? parseFloat(latLng[1]) : undefined,
    longitude: latLng ? parseFloat(latLng[2]) : undefined,
    status: inferStatus(content),
    launchDate: firstMatch(LAUNCH_PATTERN, content),
    possessionDate: firstMatch(POSSESSION_PATTERN, content),
    constructionStage: /under\s*construction|nearing\s*completion|structure/i.test(
      content
    )
      ? "under_construction"
      : undefined,
    reraNumber: reraNumber || undefined,
    minPrice: prices.minPrice,
    maxPrice: prices.maxPrice,
    pricePerSqFt: prices.pricePerSqFt,
    priceUpdatedAt: new Date().toISOString(),
    configurations,
    coverImage: images[0],
    galleryImages: images.slice(1, 30),
    masterPlanImage: images.find((i) => /master[\s-]?plan/i.test(i)),
    locationMapImage: images.find((i) => /location[\s-]?map/i.test(i)),
    constructionImages: images.filter((i) => /construction|progress/i.test(i)),
    brochurePdf: pdfLinks[0],
    ebrochure: pdfLinks.find((p) => /ebrochure|e-brochure/i.test(p)),
    amenities: flatAmenities.length ? amenities : {},
    nearbyPlaces: extractNearby(content),
    similarProjects: [],
    competitorProjects: [],
    faqs: extractFaqs(content),
    sourceUrl: canonicalUrl,
  };

  const report: ExtractionFieldReport[] = [
    reportField("projectName", facts.projectName, projectNameResult.source),
    reportField("slug", facts.slug, "derived.projectName"),
    reportField("builderName", facts.builderName, "input.builderName"),
    reportField("location", facts.location ?? null, locationResult.source),
    reportField("microMarket", facts.microMarket ?? null, locationResult.source),
    reportField("reraNumber", facts.reraNumber ?? null, reraResult.source),
    reportField(
      "minPrice",
      facts.minPrice ?? null,
      facts.minPrice ? "markdown.price-pattern" : "not-found"
    ),
    reportField(
      "maxPrice",
      facts.maxPrice ?? null,
      facts.maxPrice ? "markdown.price-pattern" : "not-found"
    ),
    reportField(
      "pricePerSqFt",
      facts.pricePerSqFt ?? null,
      facts.pricePerSqFt ? "markdown.price-per-sqft" : "not-found"
    ),
    reportField(
      "configurations",
      facts.configurations.map((c) => c.configurationName),
      facts.configurations.length ? "markdown.bhk-pattern" : "fallback.default-config"
    ),
    reportField(
      "amenities",
      flatAmenities,
      flatAmenities.length ? "markdown.amenity-keywords" : "not-found"
    ),
    reportField(
      "coverImage",
      facts.coverImage ?? null,
      facts.coverImage ? "scrape.images|markdown" : "not-found"
    ),
    reportField(
      "galleryImages",
      facts.galleryImages,
      facts.galleryImages.length ? "scrape.images|markdown|links" : "not-found"
    ),
    reportField(
      "brochurePdf",
      facts.brochurePdf ?? null,
      facts.brochurePdf ? "markdown.pdf-link" : "not-found"
    ),
    reportField("status", facts.status ?? null, "markdown.status-keywords"),
    reportField(
      "possessionDate",
      facts.possessionDate ?? null,
      facts.possessionDate ? "markdown.possession-pattern" : "not-found"
    ),
    reportField(
      "metadata.title",
      String(input.metadata?.title ?? ""),
      "scrape.metadata.title"
    ),
    reportField(
      "metadata.description",
      String(input.metadata?.description ?? input.metadata?.ogDescription ?? ""),
      "scrape.metadata.description"
    ),
    reportField("sourceUrl", facts.sourceUrl, "url.canonical"),
    reportField("originalUrl", input.url, "input.url"),
  ];

  return {
    facts,
    report,
    canonicalUrl,
    sourceUrl: input.url,
  };
}

export function parseProjectPage(input: {
  url: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  links?: string[];
  images?: string[];
  builderName: string;
  builderWebsite: string;
}): ExtractedProjectFacts {
  return parseProjectPageWithReport(input).facts;
}

export function parseBuilderListingPage(input: {
  url: string;
  markdown?: string;
  html?: string;
  links?: string[];
  builderName: string;
  builderWebsite: string;
  projectLinkPattern?: RegExp;
  builderSlug?: string;
}): { builder: ExtractedBuilderFacts; projectUrls: string[] } {
  const content = [input.markdown, input.html].filter(Boolean).join("\n");
  const pattern = input.projectLinkPattern ?? /\/projects?\//i;

  const rawUrls = (input.links ?? [])
    .map((link) => resolveUrl(link, input.url))
    .filter((url): url is string => Boolean(url))
    .filter((url) => pattern.test(url) && url !== input.url);

  const filtered = rawUrls.filter((url) =>
    isLikelyProjectDetailUrl(url, input.builderSlug)
  );
  const canonicalUrls = dedupeCanonicalProjectUrls(filtered);
  const primary = selectPrimaryProjectUrl(rawUrls, input.builderSlug);
  const projectUrls = primary
    ? [primary, ...canonicalUrls.filter((url) => url !== primary)]
    : canonicalUrls;

  const yearMatch = content.match(/(?:established|since|founded)[:\s]*(\d{4})/i);
  const completedMatch = content.match(/(\d+)\+?\s*(?:completed|delivered)\s*projects/i);
  const ongoingMatch = content.match(/(\d+)\+?\s*(?:ongoing|current)\s*projects/i);

  return {
    builder: {
      builderName: input.builderName,
      builderLogo: extractImages(content, input.url).find((i) =>
        /logo/i.test(i)
      ),
      builderDescription: undefined,
      yearEstablished: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
      completedProjects: completedMatch
        ? parseInt(completedMatch[1], 10)
        : undefined,
      ongoingProjects: ongoingMatch ? parseInt(ongoingMatch[1], 10) : undefined,
      website: input.builderWebsite,
    },
    projectUrls,
  };
}

export function filterProjectUrls(
  urls: string[],
  pattern?: RegExp,
  baseUrl?: string
): string[] {
  const resolved = urls
    .map((u) => (baseUrl ? resolveUrl(u, baseUrl) : u))
    .filter((u): u is string => Boolean(u));
  const filtered = pattern
    ? resolved.filter((u) => pattern.test(u))
    : resolved;
  return [...new Set(filtered)];
}
