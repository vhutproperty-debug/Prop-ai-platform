import type { ContentType } from "@/config/content-engine";

/** Content cluster generated automatically when a project is published from import. */
export const PUBLISH_CONTENT_CLUSTER: Array<{
  type: ContentType;
  label: string;
}> = [
  { type: "investment_analysis", label: "Investment Guide" },
  { type: "location_guide", label: "Location Guide" },
  { type: "amenities_guide", label: "Amenities Guide" },
  { type: "project_guide", label: "Floor Plan Guide" },
  { type: "price_analysis", label: "Price Analysis" },
  { type: "buying_guide", label: "Buyer's Guide" },
];

export const DEFAULT_FIRST_IMPORT_BUILDER = "lodha" as const;
