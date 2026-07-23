/** Shared media helpers for Project Intelligence downloads. */

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;
const PDF_EXT = /\.pdf(\?|$)/i;

const FLOOR_PLAN_KEYWORDS =
  /floorplan|floor-plan|floor_plan|masterplan|master-plan|master_plan|layout|typology|site-plan|siteplan|\b[234]\s*bhk\b/i;

const BROCHURE_KEYWORDS = /brochure|ebrochure|e-brochure|download\s*brochure/i;

export function filenameFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const segment = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
    const base = segment.split("?")[0];
    if (base && base.length > 1) return base;
  } catch {
    // ignore
  }
  return fallback;
}

export function mimeTypeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

export function isImageUrl(url: string): boolean {
  return IMAGE_EXT.test(url);
}

export function isPdfUrl(url: string): boolean {
  return PDF_EXT.test(url);
}

export function isFloorPlanUrl(url: string, context = ""): boolean {
  const haystack = `${url} ${context}`.toLowerCase();
  return FLOOR_PLAN_KEYWORDS.test(haystack);
}

export function isBrochureUrl(url: string, context = ""): boolean {
  const haystack = `${url} ${context}`.toLowerCase();
  return BROCHURE_KEYWORDS.test(haystack) || (isPdfUrl(url) && BROCHURE_KEYWORDS.test(context));
}

export function sanitizeZipEntryName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 180);
}

export function uniqueFilename(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  let index = 2;
  while (used.has(`${stem}-${index}${ext}`)) index += 1;
  const unique = `${stem}-${index}${ext}`;
  used.add(unique);
  return unique;
}

export function sequentialImageFilename(index: number, url: string): string {
  const extMatch = url.match(/\.(jpe?g|png|webp|gif|avif)(\?|$)/i);
  const ext = extMatch ? `.${extMatch[1]!.toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
  return `image-${index}${ext}`;
}

export function sequentialFloorPlanFilename(index: number, url: string): string {
  const extMatch = url.match(/\.(jpe?g|png|webp|gif|avif|pdf)(\?|$)/i);
  const ext = extMatch ? `.${extMatch[1]!.toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
  return `floorplan-${index}${ext}`;
}

export function extractUrlsFromContent(content: string): string[] {
  const urls = new Set<string>();
  const patterns = [
    /https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif|avif|pdf)(?:[^\s"'<>]*)?/gi,
    /href=["']([^"']+\.(?:jpe?g|png|webp|gif|avif|pdf)[^"']*)["']/gi,
    /src=["']([^"']+\.(?:jpe?g|png|webp|gif|avif|pdf)[^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const candidate = match[1] ?? match[0];
      if (candidate.startsWith("http")) urls.add(candidate);
    }
  }

  return [...urls];
}

export function resolveAssetUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

export { FLOOR_PLAN_KEYWORDS, BROCHURE_KEYWORDS, IMAGE_EXT, PDF_EXT };
