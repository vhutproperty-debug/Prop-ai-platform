export const CONFIGURATION_TYPES = [
  "1 BHK",
  "2 BHK",
  "3 BHK",
  "4 BHK",
  "4 BHK+",
  "5 BHK",
  "Villa",
  "Penthouse",
  "Studio",
  "Office",
  "Retail",
] as const;
export type ConfigurationType = (typeof CONFIGURATION_TYPES)[number];

export const AMENITY_CATEGORIES = [
  "lifestyle",
  "sports",
  "security",
  "convenience",
  "green",
  "wellness",
  "parking",
  "connectivity",
] as const;
export type AmenityCategory = (typeof AMENITY_CATEGORIES)[number];

export const IMAGE_ENTITY_TYPES = [
  "project",
  "builder",
  "location",
] as const;
export type ImageEntityType = (typeof IMAGE_ENTITY_TYPES)[number];

export const IMAGE_TYPES = [
  "cover",
  "gallery",
  "brochure",
  "logo",
  "floorplan",
] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

export const FAQ_ENTITY_TYPES = [
  "project",
  "builder",
  "location",
] as const;
export type FaqEntityType = (typeof FAQ_ENTITY_TYPES)[number];

export const LOCATION_TYPES = [
  "locality",
  "micro_market",
  "suburb",
  "district",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];
