import type {
  ExtractedBuilderFacts,
  ExtractedConfiguration,
  ExtractedProjectFacts,
} from "@/types/firecrawl-import";
import {
  generateProjectSlug,
} from "@/lib/normalizers/helpers";

const RERA_PATTERN =
  /(?:RERA|MahaRERA|MAHARERA)[:\s#]*([A-Z]{2,4}\/[A-Z]+\/\d{4}\/\d+(?:\/[A-Z0-9]+)?)/gi;
const BHK_PATTERN = /(\d)\s*(?:BHK|bhk)/gi;
const SQFT_PATTERN = /(\d{2,5})\s*(?:sq\.?\s*ft|sqft|square\s*feet)/gi;
const PRICE_CR_PATTERN = /(?:₹|Rs\.?|INR)\s*([\d,.]+)\s*(?:Cr|CR|crore)/gi;
const PRICE_LAKH_PATTERN = /(?:₹|Rs\.?|INR)\s*([\d,.]+)\s*(?:Lakh|Lac|L)/gi;
const PRICE_PER_SQFT = /(?:₹|Rs\.?)\s*([\d,]+)\s*(?:per|\/)\s*sq\.?\s*ft/gi;
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

function inferProjectName(
  url: string,
  metadata?: Record<string, unknown>
): string {
  const title = (metadata?.title as string) ?? "";
  if (title) {
    const cleaned = title
      .replace(/\s*[-|]\s*.+$/, "")
      .replace(/(?:Lodha|Godrej|Oberoi|Rustomjee|Kalpataru|Runwal|Sunteck|Shapoorji).*/i, "")
      .trim();
    if (cleaned.length >= 3) return cleaned;
  }
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "project";
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferLocation(text: string): string | undefined {
  const mumbaiAreas =
    /(?:at|in|located\s*(?:at|in))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i;
  return firstMatch(mumbaiAreas, text);
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
  const content = [input.markdown, input.html].filter(Boolean).join("\n");
  const projectName = inferProjectName(input.url, input.metadata);
  const slug = generateProjectSlug(input.builderName, projectName);
  const prices = extractPrices(content);
  const configurations = extractConfigurations(content);
  const images = collectScrapeImages({
    content,
    baseUrl: input.url,
    images: input.images,
    links: input.links,
    metadata: input.metadata,
  });
  const pdfLinks: string[] = [];
  const pdfRe = new RegExp(PDF_LINK.source, PDF_LINK.flags);
  let pdfMatch: RegExpExecArray | null;
  while ((pdfMatch = pdfRe.exec(content)) !== null) {
    const resolved = resolveUrl(pdfMatch[1], input.url);
    if (resolved) pdfLinks.push(resolved);
  }

  const latLng = [...content.matchAll(LAT_LNG_PATTERN)][0];
  const amenities = extractAmenities(content);
  const flatAmenities = Object.values(amenities).flat();

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

  return {
    projectName,
    slug,
    builderName: input.builderName,
    microMarket: inferLocation(content),
    location: inferLocation(content),
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
    reraNumber: allMatches(RERA_PATTERN, content)[0],
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
    sourceUrl: input.url,
  };
}

export function parseBuilderListingPage(input: {
  url: string;
  markdown?: string;
  html?: string;
  links?: string[];
  builderName: string;
  builderWebsite: string;
  projectLinkPattern?: RegExp;
}): { builder: ExtractedBuilderFacts; projectUrls: string[] } {
  const content = [input.markdown, input.html].filter(Boolean).join("\n");
  const pattern = input.projectLinkPattern ?? /\/projects?\//i;

  const projectUrls = (input.links ?? [])
    .map((link) => resolveUrl(link, input.url))
    .filter((url): url is string => Boolean(url))
    .filter((url) => pattern.test(url) && url !== input.url);

  const uniqueUrls = [...new Set(projectUrls)];

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
    projectUrls: uniqueUrls,
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
