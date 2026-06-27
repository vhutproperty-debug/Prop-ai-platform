/** Known project sub-page path segments (not canonical project roots). */
export const PROJECT_SUBPAGE_SLUGS = new Set([
  "gallery",
  "amenities",
  "amenity",
  "location",
  "plans",
  "plan",
  "prices",
  "price",
  "about",
  "overview",
  "floor-plans",
  "floorplan",
  "floor-plans",
  "specifications",
  "specs",
  "brochure",
  "virtual-tour",
  "walkthrough",
  "contact",
  "enquiry",
  "reviews",
  "videos",
  "media",
]);

/** Listing/category segments that are not project slugs. */
const CATEGORY_SLUG_PATTERNS = [
  /^residential$/i,
  /^commercial$/i,
  /^projects$/i,
  /property-in-/i,
  /^all-projects$/i,
  /^ongoing-projects$/i,
];

export function isProjectSubpageSlug(slug: string): boolean {
  return PROJECT_SUBPAGE_SLUGS.has(slug.toLowerCase());
}

export function isCategorySlug(slug: string): boolean {
  return CATEGORY_SLUG_PATTERNS.some((pattern) => pattern.test(slug));
}

export function getUrlPathSegments(url: string): string[] {
  try {
    return new URL(url).pathname.split("/").filter(Boolean);
  } catch {
    return [];
  }
}

/** Strip trailing sub-page segments to reach the canonical project root URL. */
export function resolveCanonicalProjectUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);

    while (
      segments.length > 0 &&
      isProjectSubpageSlug(segments[segments.length - 1] ?? "")
    ) {
      segments.pop();
    }

    parsed.pathname = `/${segments.join("/")}`;
    parsed.hash = "";
    parsed.search = "";
    return parsed.href.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function scoreProjectUrl(url: string): number {
  let score = 0;
  const segments = getUrlPathSegments(url);
  const last = segments[segments.length - 1] ?? "";

  if (isProjectSubpageSlug(last)) score -= 50;
  if (isCategorySlug(last)) score -= 40;
  if (segments.includes("projects") && segments.length >= 3) score += 20;
  if (!isProjectSubpageSlug(last) && !isCategorySlug(last)) score += 10;

  const canonical = resolveCanonicalProjectUrl(url);
  if (url.replace(/\/$/, "") === canonical.replace(/\/$/, "")) score += 30;

  return score;
}

export function isLikelyProjectDetailUrl(
  url: string,
  builderSlug?: string
): boolean {
  const segments = getUrlPathSegments(url);
  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx === -1) return false;

  const afterProjects = segments.slice(projectsIdx + 1);
  if (!afterProjects.length) return false;

  const last = afterProjects[afterProjects.length - 1] ?? "";
  if (isCategorySlug(last)) return false;

  if (builderSlug === "lodha") {
    return afterProjects.length >= 2;
  }

  if (builderSlug === "oberoi-realty") {
    return afterProjects.length >= 1 && !isCategorySlug(afterProjects[0] ?? "");
  }

  return afterProjects.length >= 1;
}

export function selectPrimaryProjectUrl(
  urls: string[],
  builderSlug?: string
): string | undefined {
  const ranked = [...urls]
    .filter((url) => isLikelyProjectDetailUrl(url, builderSlug))
    .sort((a, b) => scoreProjectUrl(b) - scoreProjectUrl(a));

  const seen = new Set<string>();
  for (const url of ranked) {
    const canonical = resolveCanonicalProjectUrl(url);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    return canonical;
  }

  return undefined;
}

export function dedupeCanonicalProjectUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const canonical = resolveCanonicalProjectUrl(url);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(canonical);
  }

  return result;
}

export function inferProjectSlugFromUrl(url: string): string | undefined {
  const segments = getUrlPathSegments(resolveCanonicalProjectUrl(url));
  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx === -1) return undefined;

  const afterProjects = segments.slice(projectsIdx + 1);
  const slug = afterProjects[afterProjects.length - 1];
  if (!slug || isCategorySlug(slug) || isProjectSubpageSlug(slug)) return undefined;
  return slug;
}

export function inferLocalityFromUrl(url: string): string | undefined {
  const match = url.match(/property-in-([a-z0-9-]+)/i);
  if (!match) return undefined;
  return match[1]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
