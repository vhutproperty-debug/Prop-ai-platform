import { POI_TYPES, type PoiType } from "@/config/location-intelligence";
import { slugify } from "@/lib/utils";
import type { FirecrawlNearbyPlace } from "@/types/location-intelligence";

const TYPE_ALIASES: Record<string, PoiType> = {
  school: "school",
  schools: "school",
  college: "school",
  university: "school",
  hospital: "hospital",
  hospitals: "hospital",
  clinic: "hospital",
  medical: "hospital",
  metro: "metro",
  subway: "metro",
  "metro station": "metro",
  mall: "mall",
  shopping: "mall",
  airport: "airport",
  railway: "railway",
  train: "railway",
  "railway station": "railway",
};

export function normalizePoiType(raw: string): PoiType {
  const key = raw.trim().toLowerCase();
  if ((POI_TYPES as readonly string[]).includes(key)) {
    return key as PoiType;
  }
  return TYPE_ALIASES[key] ?? "other";
}

export function buildNearbyPlaceSlug(name: string, type: PoiType): string {
  return slugify(`${type}-${name}`).slice(0, 180);
}

export function parseDistanceLabel(label?: string): {
  distanceLabel?: string;
  distanceMeters?: number;
} {
  if (!label?.trim()) return {};

  const normalized = label.trim();
  const kmMatch = normalized.match(/([\d.]+)\s*km/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1]);
    if (!Number.isNaN(km)) {
      return {
        distanceLabel: normalized,
        distanceMeters: Math.round(km * 1000),
      };
    }
  }

  const mMatch = normalized.match(/([\d.]+)\s*m(?:eters?)?/i);
  if (mMatch) {
    const meters = parseFloat(mMatch[1]);
    if (!Number.isNaN(meters)) {
      return { distanceLabel: normalized, distanceMeters: Math.round(meters) };
    }
  }

  return { distanceLabel: normalized };
}

export function parseTravelTimeLabel(label?: string): {
  travelTimeLabel?: string;
  travelTimeMinutes?: number;
} {
  if (!label?.trim()) return {};

  const normalized = label.trim();
  const minMatch = normalized.match(/([\d.]+)\s*min/i);
  if (minMatch) {
    const minutes = parseFloat(minMatch[1]);
    if (!Number.isNaN(minutes)) {
      return {
        travelTimeLabel: normalized,
        travelTimeMinutes: Math.round(minutes),
      };
    }
  }

  return { travelTimeLabel: normalized };
}

export function mapFirecrawlPlace(place: FirecrawlNearbyPlace) {
  const type = normalizePoiType(place.type);
  const distance = parseDistanceLabel(place.distance);
  const travel = parseTravelTimeLabel(place.travelTime);

  return {
    type,
    name: place.name.trim(),
    slug: buildNearbyPlaceSlug(place.name, type),
    ...distance,
    ...travel,
    confidence: "medium" as const,
  };
}

export function detectPoiDataGaps(
  existingTypes: PoiType[],
  requiredTypes: PoiType[]
): PoiType[] {
  return requiredTypes.filter((type) => !existingTypes.includes(type));
}
