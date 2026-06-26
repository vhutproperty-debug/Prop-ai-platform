export const POI_TYPES = [
  "school",
  "hospital",
  "metro",
  "mall",
  "airport",
  "railway",
  "other",
] as const;
export type PoiType = (typeof POI_TYPES)[number];

export const POI_ENTITY_TYPES = ["project", "location"] as const;
export type PoiEntityType = (typeof POI_ENTITY_TYPES)[number];

export const POI_SOURCES = ["manual", "firecrawl", "import"] as const;
export type PoiSource = (typeof POI_SOURCES)[number];

export const POI_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type PoiConfidenceLevel = (typeof POI_CONFIDENCE_LEVELS)[number];

export const POI_TYPE_LABELS: Record<PoiType, string> = {
  school: "School",
  hospital: "Hospital",
  metro: "Metro",
  mall: "Mall",
  airport: "Airport",
  railway: "Railway",
  other: "Other",
};

/** Content types that require nearby POI data before generation. */
export const POI_REQUIRED_CONTENT_TYPES: Partial<
  Record<string, PoiType[]>
> = {
  nearby_schools: ["school"],
  nearby_hospitals: ["hospital"],
  connectivity_guide: ["metro", "railway", "airport"],
};
