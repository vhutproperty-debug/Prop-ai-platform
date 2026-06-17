import type {
  AISearchSuggestion,
  Builder,
  ComparisonFeature,
  InvestmentMetric,
  Locality,
  MarketInsight,
  Project,
  WhyPropAI,
} from "@/types";

export const searchSuggestions: AISearchSuggestion[] = [
  {
    id: "1",
    text: "3 BHK sea-facing apartments in Worli under ₹5 Cr",
    category: "Residential",
  },
  {
    id: "2",
    text: "Best investment localities in Mumbai with 8%+ rental yield",
    category: "Investment",
  },
  {
    id: "3",
    text: "Premium projects by Lodha in South Mumbai",
    category: "Builder",
  },
  {
    id: "4",
    text: "Compare Bandra West vs Juhu for family living",
    category: "Compare",
  },
  {
    id: "5",
    text: "Office spaces in BKC with metro connectivity",
    category: "Commercial",
  },
];

export const featuredProjects: Project[] = [
  {
    id: "1",
    slug: "lodha-world-towers",
    name: "World Towers",
    builder: "Lodha",
    locality: "Lower Parel",
    configuration: "3 & 4 BHK",
    priceFrom: 45000000,
    priceTo: 120000000,
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80",
    tagline: "Sky-high living in the heart of Mumbai",
    status: "ongoing",
    featured: true,
  },
  {
    id: "2",
    slug: "raheja-modern-vivarea",
    name: "Modern Vivarea",
    builder: "K Raheja Corp",
    locality: "Mahalaxmi",
    configuration: "2 & 3 BHK",
    priceFrom: 28000000,
    priceTo: 65000000,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    tagline: "Contemporary elegance meets urban convenience",
    status: "ready",
    featured: true,
  },
  {
    id: "3",
    slug: "oberoi-threes-sixty-west",
    name: "Three Sixty West",
    builder: "Oberoi Realty",
    locality: "Worli",
    configuration: "4 & 5 BHK",
    priceFrom: 85000000,
    priceTo: 250000000,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    tagline: "Ultra-luxury residences with Arabian Sea views",
    status: "ongoing",
    featured: true,
  },
  {
    id: "4",
    slug: "prestige-ocean-towers",
    name: "Ocean Towers",
    builder: "Prestige Group",
    locality: "Marine Drive",
    configuration: "3 & 4 BHK",
    priceFrom: 55000000,
    priceTo: 150000000,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    tagline: "Where the city meets the sea",
    status: "upcoming",
    featured: true,
  },
];

export const localities: Locality[] = [
  {
    id: "1",
    slug: "bandra-west",
    name: "Bandra West",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    investmentScore: 92,
    rentalScore: 88,
    growthScore: 85,
    walkability: 94,
    connectivity: 96,
    aiRecommendation:
      "Premium lifestyle hub with strong appreciation and rental demand",
    avgPricePerSqft: 45000,
  },
  {
    id: "2",
    slug: "worli",
    name: "Worli",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    investmentScore: 95,
    rentalScore: 82,
    growthScore: 91,
    walkability: 78,
    connectivity: 94,
    aiRecommendation:
      "High-growth corridor with luxury developments and sea views",
    avgPricePerSqft: 52000,
  },
  {
    id: "3",
    slug: "powai",
    name: "Powai",
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
    investmentScore: 87,
    rentalScore: 91,
    growthScore: 88,
    walkability: 72,
    connectivity: 85,
    aiRecommendation:
      "IT hub proximity drives consistent rental yields",
    avgPricePerSqft: 28000,
  },
  {
    id: "4",
    slug: "andheri-west",
    name: "Andheri West",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    investmentScore: 84,
    rentalScore: 89,
    growthScore: 83,
    walkability: 80,
    connectivity: 92,
    aiRecommendation:
      "Balanced investment with metro connectivity and diverse inventory",
    avgPricePerSqft: 22000,
  },
];

export const marketInsights: MarketInsight[] = [
  {
    id: "1",
    title: "Avg. Price / sq.ft",
    value: "₹38,500",
    change: 4.2,
    trend: "up",
    category: "price",
  },
  {
    id: "2",
    title: "Rental Yield",
    value: "3.8%",
    change: 0.3,
    trend: "up",
    category: "rental",
  },
  {
    id: "3",
    title: "Market Sentiment",
    value: "Bullish",
    change: 12,
    trend: "up",
    category: "demand",
  },
  {
    id: "4",
    title: "Top Builder Share",
    value: "Lodha 18%",
    change: 2.1,
    trend: "up",
    category: "builder",
  },
];

export const builders: Builder[] = [
  {
    id: "1",
    slug: "lodha",
    name: "Lodha",
    logo: "L",
    tagline: "Building a better life",
    projectCount: 45,
    established: 1980,
    rating: 4.8,
  },
  {
    id: "2",
    slug: "oberoi-realty",
    name: "Oberoi Realty",
    logo: "O",
    tagline: "Luxury redefined",
    projectCount: 12,
    established: 1998,
    rating: 4.9,
  },
  {
    id: "3",
    slug: "k-raheja",
    name: "K Raheja Corp",
    logo: "K",
    tagline: "Creating landmarks",
    projectCount: 28,
    established: 1956,
    rating: 4.7,
  },
  {
    id: "4",
    slug: "prestige",
    name: "Prestige Group",
    logo: "P",
    tagline: "Adding value to life",
    projectCount: 18,
    established: 1986,
    rating: 4.6,
  },
  {
    id: "5",
    slug: "godrej",
    name: "Godrej Properties",
    logo: "G",
    tagline: "Trust built over generations",
    projectCount: 22,
    established: 1990,
    rating: 4.8,
  },
];

export const comparisonFeatures: ComparisonFeature[] = [
  {
    id: "1",
    title: "AI Property Compare",
    description:
      "Compare projects side-by-side with intelligent scoring across 50+ parameters",
    icon: "compare",
  },
  {
    id: "2",
    title: "Locality Intelligence",
    description:
      "Deep locality analysis with investment, rental, and lifestyle scores",
    icon: "map",
  },
  {
    id: "3",
    title: "Price Prediction",
    description:
      "AI-powered price forecasting based on market trends and project data",
    icon: "trending",
  },
  {
    id: "4",
    title: "Builder Credibility",
    description:
      "Verified builder track records, delivery history, and quality ratings",
    icon: "shield",
  },
];

export const investmentMetrics: InvestmentMetric[] = [
  {
    id: "1",
    label: "Top Yield Locality",
    value: "Powai — 4.2%",
    insight: "Consistent demand from IT professionals",
  },
  {
    id: "2",
    label: "Fastest Appreciation",
    value: "Worli — +12.4% YoY",
    insight: "Infrastructure upgrades driving premium pricing",
  },
  {
    id: "3",
    label: "Emerging Hotspot",
    value: "Thane West",
    insight: "Metro expansion creating new investment corridors",
  },
  {
    id: "4",
    label: "AI Portfolio Score",
    value: "8.7 / 10",
    insight: "Mumbai market showing strong fundamentals in 2026",
  },
];

export const whyPropAI: WhyPropAI[] = [
  {
    id: "1",
    title: "AI-First Experience",
    description:
      "Natural language search that understands intent, not just keywords",
  },
  {
    id: "2",
    title: "Mumbai Intelligence",
    description:
      "Deep market data across every locality, builder, and project in the city",
  },
  {
    id: "3",
    title: "Investment Grade Insights",
    description:
      "Institutional-quality analysis made accessible for every buyer",
  },
  {
    id: "4",
    title: "Premium by Design",
    description:
      "Every interaction crafted for clarity, speed, and confidence",
  },
];
