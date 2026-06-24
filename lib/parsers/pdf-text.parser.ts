/**
 * Extracts factual structured data from brochure plain text.
 * Does NOT store or reproduce marketing copy — only regex-matched facts.
 */
export interface PdfFactsExtracted {
  reraNumber?: string;
  possessionDate?: string;
  projectName?: string;
  builderName?: string;
  priceRanges: Array<{ min: number; max: number }>;
  configurations: Array<{ type: string; bhk?: number }>;
  amenities: string[];
}

const RERA_PATTERN = /RERA\s*(?:No\.?|Number|#)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i;
const POSSESSION_PATTERN =
  /(?:possession|completion|handover)\s*[:\-]?\s*(\w+\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i;
const PRICE_PATTERN =
  /(?:₹|Rs\.?|INR)\s*([\d,.]+)\s*(?:Cr|Lakh|L|crore)?(?:\s*[-–to]+\s*(?:₹|Rs\.?|INR)?\s*([\d,.]+)\s*(?:Cr|Lakh|L|crore)?)?/gi;
const BHK_PATTERN = /(\d)\s*BHK/gi;

const FACTUAL_AMENITY_KEYWORDS = [
  "swimming pool",
  "gym",
  "clubhouse",
  "parking",
  "garden",
  "security",
  "play area",
  "jogging track",
  "power backup",
  "lift",
  "concierge",
];

export function parsePdfText(text: string): PdfFactsExtracted {
  const normalized = text.replace(/\s+/g, " ").trim();

  const reraMatch = normalized.match(RERA_PATTERN);
  const possessionMatch = normalized.match(POSSESSION_PATTERN);

  const priceRanges: Array<{ min: number; max: number }> = [];
  let priceMatch: RegExpExecArray | null;
  const priceRegex = new RegExp(PRICE_PATTERN.source, "gi");
  while ((priceMatch = priceRegex.exec(normalized)) !== null) {
    const min = parseIndianPrice(priceMatch[1], priceMatch[0]);
    const max = priceMatch[2]
      ? parseIndianPrice(priceMatch[2], priceMatch[0])
      : min;
    if (min > 0) priceRanges.push({ min, max: Math.max(min, max) });
  }

  const configurations: Array<{ type: string; bhk?: number }> = [];
  let bhkMatch: RegExpExecArray | null;
  const bhkRegex = new RegExp(BHK_PATTERN.source, "gi");
  const seenBhk = new Set<number>();
  while ((bhkMatch = bhkRegex.exec(normalized)) !== null) {
    const bhk = parseInt(bhkMatch[1], 10);
    if (!seenBhk.has(bhk)) {
      seenBhk.add(bhk);
      configurations.push({ type: `${bhk} BHK`, bhk });
    }
  }

  const lower = normalized.toLowerCase();
  const amenities = FACTUAL_AMENITY_KEYWORDS.filter((a) => lower.includes(a));

  return {
    reraNumber: reraMatch?.[1]?.trim(),
    possessionDate: possessionMatch?.[1]?.trim(),
    priceRanges,
    configurations,
    amenities,
  };
}

function parseIndianPrice(value: string, context: string): number {
  const num = parseFloat(value.replace(/,/g, ""));
  if (Number.isNaN(num)) return 0;
  const ctx = context.toLowerCase();
  if (ctx.includes("cr") || ctx.includes("crore")) return num * 10_000_000;
  if (ctx.includes("lakh") || ctx.includes("l")) return num * 100_000;
  return num;
}
