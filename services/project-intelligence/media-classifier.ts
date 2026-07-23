import type { FirecrawlScrapeResult } from "@/services/firecrawl/firecrawl.service";
import {
  extractUrlsFromContent,
  filenameFromUrl,
  isBrochureUrl,
  isFloorPlanUrl,
  isImageUrl,
  isPdfUrl,
  mimeTypeFromFilename,
  resolveAssetUrl,
  sequentialFloorPlanFilename,
  sequentialImageFilename,
  uniqueFilename,
} from "@/lib/project-intelligence/media-utils";
import type {
  ProjectIntelligenceBrochureAsset,
  ProjectIntelligenceFloorPlanAsset,
  ProjectIntelligenceImageAsset,
  ProjectIntelligenceMediaItem,
} from "@/types/project-intelligence";

const SKIP_URL = /logo|icon|svg|close\.|enquire|call\.|chat\.|pixel|tracking|analytics/i;

function inferFloorPlanType(url: string, context: string): string {
  const haystack = `${url} ${context}`.toLowerCase();
  if (/master.?plan|site.?plan/.test(haystack)) return "master_plan";
  if (/typology/.test(haystack)) return "typology";
  if (/layout/.test(haystack)) return "layout";
  if (/\b4\s*bhk\b/.test(haystack)) return "4 BHK";
  if (/\b3\s*bhk\b/.test(haystack)) return "3 BHK";
  if (/\b2\s*bhk\b/.test(haystack)) return "2 BHK";
  if (/floor.?plan/.test(haystack)) return "floor_plan";
  return "floor_plan";
}

function classifyLegacyMediaType(url: string): ProjectIntelligenceMediaItem["type"] {
  const lower = url.toLowerCase();
  if (/floor.?plan|layout|typology|\b[234]\s*bhk\b/.test(lower)) return "floor_plan";
  if (/master.?plan|site.?plan/.test(lower)) return "master_plan";
  if (/amenit|pool|gym|club/.test(lower)) return "amenity";
  if (/exterior|facade|elevation/.test(lower)) return "exterior";
  if (/interior|living|kitchen|bedroom/.test(lower)) return "interior";
  if (/brochure|ebrochure/.test(lower)) return "brochure";
  return "project";
}

function collectCandidateUrls(scrapes: FirecrawlScrapeResult[]): Array<{
  url: string;
  sourceUrl: string;
  context: string;
}> {
  const candidates: Array<{ url: string; sourceUrl: string; context: string }> = [];
  const seen = new Set<string>();

  for (const scrape of scrapes) {
    const content = [scrape.markdown, scrape.html].filter(Boolean).join("\n");
    const fromContent = extractUrlsFromContent(content);
    const fromScrape = [
      ...(scrape.images ?? []),
      ...(scrape.links ?? []),
    ];

    for (const href of [...fromScrape, ...fromContent]) {
      const resolved = resolveAssetUrl(href, scrape.url);
      if (!resolved || seen.has(resolved) || SKIP_URL.test(resolved)) continue;
      seen.add(resolved);

      const contextStart = content.indexOf(href);
      const context =
        contextStart >= 0
          ? content.slice(Math.max(0, contextStart - 80), contextStart + href.length + 80)
          : href;

      candidates.push({ url: resolved, sourceUrl: scrape.url, context });
    }
  }

  return candidates;
}

export function buildStructuredMediaAssets(scrapes: FirecrawlScrapeResult[]): {
  media: ProjectIntelligenceMediaItem[];
  images: ProjectIntelligenceImageAsset[];
  floorPlans: ProjectIntelligenceFloorPlanAsset[];
  brochures: ProjectIntelligenceBrochureAsset[];
} {
  const candidates = collectCandidateUrls(scrapes);
  const media: ProjectIntelligenceMediaItem[] = [];
  const images: ProjectIntelligenceImageAsset[] = [];
  const floorPlans: ProjectIntelligenceFloorPlanAsset[] = [];
  const brochures: ProjectIntelligenceBrochureAsset[] = [];

  const usedImageNames = new Set<string>();
  const usedFloorPlanNames = new Set<string>();
  const usedBrochureNames = new Set<string>();

  let imageIndex = 1;
  let floorPlanIndex = 1;
  let brochureIndex = 1;

  for (const candidate of candidates) {
    const { url, sourceUrl, context } = candidate;
    const legacyType = classifyLegacyMediaType(`${url} ${context}`);

    media.push({
      url,
      type: legacyType,
      sourceUrl,
    });

    if (isPdfUrl(url) && isBrochureUrl(url, context)) {
      const rawName =
        filenameFromUrl(url, `brochure-${brochureIndex}.pdf`) ||
        `brochure-${brochureIndex}.pdf`;
      const filename = uniqueFilename(rawName, usedBrochureNames);
      brochures.push({
        url,
        filename,
        mimeType: "application/pdf",
        source: sourceUrl,
      });
      brochureIndex += 1;
      continue;
    }

    if (!isImageUrl(url)) continue;

    if (isFloorPlanUrl(url, context) || legacyType === "floor_plan" || legacyType === "master_plan") {
      const rawName =
        filenameFromUrl(url, sequentialFloorPlanFilename(floorPlanIndex, url)) ||
        sequentialFloorPlanFilename(floorPlanIndex, url);
      const filename = uniqueFilename(rawName, usedFloorPlanNames);
      floorPlans.push({
        url,
        filename,
        type: inferFloorPlanType(url, context),
        mimeType: mimeTypeFromFilename(filename),
        source: sourceUrl,
      });
      floorPlanIndex += 1;
      continue;
    }

    const rawName =
      filenameFromUrl(url, sequentialImageFilename(imageIndex, url)) ||
      sequentialImageFilename(imageIndex, url);
    const filename = uniqueFilename(rawName, usedImageNames);
    images.push({
      url,
      filename,
      mimeType: mimeTypeFromFilename(filename),
      source: sourceUrl,
      downloaded: false,
      type: legacyType,
    });
    imageIndex += 1;
  }

  return { media, images, floorPlans, brochures };
}
