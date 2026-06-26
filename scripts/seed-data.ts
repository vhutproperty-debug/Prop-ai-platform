/**
 * Idempotent seed data — uses fixed slugs to avoid duplicates.
 * Does NOT import from homepage static data.
 */

export const SEED_BUILDER = {
  slug: "seed-sample-builder",
  name: "Seed Sample Builder",
  tagline: "Sample builder for local development",
  website: "https://example.com",
  establishedYear: 1990,
  isActive: true,
  isFeatured: true,
  rating: 4.5,
};

export const SEED_LOCATION = {
  slug: "seed-sample-worli",
  name: "Worli",
  city: "Mumbai",
  state: "Maharashtra",
  microMarket: "Worli",
  connectivity: 85,
  investmentScore: 78,
  isActive: true,
};

export const SEED_PROJECT = {
  slug: "seed-sample-project",
  projectName: "Seed Sample Residences",
  builderName: SEED_BUILDER.name,
  locationName: SEED_LOCATION.name,
  microMarket: SEED_LOCATION.microMarket,
  tagline: "Sample project for Atlas development",
  status: "ongoing" as const,
  priceRange: { min: 2_50_00_000, max: 5_00_00_000, currency: "INR" },
  reraNumber: "P51800012345",
  isActive: true,
  featured: true,
};

export const SEED_ARTICLE = {
  slug: "seed-sample-article",
  title: "Seed Sample Project Guide",
  contentType: "project_guide" as const,
  status: "draft" as const,
  sourceType: "project" as const,
  featuredSummary: "Sample article seeded for content engine development.",
  introduction: "This is a seeded sample article for local MongoDB Atlas testing.",
  sections: [
    {
      id: "overview",
      heading: "Overview",
      body: "Sample seeded content for development verification.",
      order: 1,
    },
  ],
  keywords: ["seed", "sample", "worli"],
  isAiGenerated: false,
  isHumanEdited: true,
  authorType: "human" as const,
};

export const SEED_CAMPAIGN = {
  slug: "seed-sample-campaign",
  name: "Seed Sample Campaign",
  type: "project" as const,
  description: "Sample campaign for local development",
  isActive: true,
  contentTypes: ["project_guide", "price_analysis"],
};

export const SEED_KNOWLEDGE_PACK = {
  contentType: "project_guide" as const,
  pack: {
    researchedAt: new Date().toISOString(),
    verifiedFacts: [
      {
        key: "project_name",
        label: "Project Name",
        value: SEED_PROJECT.projectName,
        confidence: "high",
        requiresReview: false,
      },
    ],
    dataCompleteness: 80,
  },
  verifiedFacts: [
    {
      key: "project_name",
      label: "Project Name",
      value: SEED_PROJECT.projectName,
      confidence: "high",
      requiresReview: false,
    },
  ],
  dataCompleteness: 80,
  lowConfidenceCount: 0,
  externalDataAvailable: false,
};

export const SEED_NEARBY_PLACES = [
  {
    slug: "seed-worli-metro",
    type: "metro" as const,
    name: "Worli Metro Station",
    distanceLabel: "0.8 km",
    travelTimeLabel: "5 mins",
    source: "manual" as const,
    confidence: "high" as const,
  },
  {
    slug: "seed-worli-school",
    type: "school" as const,
    name: "Seed Sample International School",
    distanceLabel: "1.2 km",
    travelTimeLabel: "8 mins",
    source: "manual" as const,
    confidence: "high" as const,
  },
  {
    slug: "seed-worli-hospital",
    type: "hospital" as const,
    name: "Seed Sample Hospital",
    distanceLabel: "2.0 km",
    travelTimeLabel: "12 mins",
    source: "manual" as const,
    confidence: "high" as const,
  },
];
