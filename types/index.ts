export interface Project {
  id: string;
  slug: string;
  name: string;
  builder: string;
  locality: string;
  configuration: string;
  priceFrom: number;
  priceTo: number;
  image: string;
  tagline: string;
  status: "upcoming" | "ongoing" | "ready";
  featured?: boolean;
}

export interface Locality {
  id: string;
  slug: string;
  name: string;
  image: string;
  investmentScore: number;
  rentalScore: number;
  growthScore: number;
  walkability: number;
  connectivity: number;
  aiRecommendation: string;
  avgPricePerSqft: number;
}

export interface Builder {
  id: string;
  slug: string;
  name: string;
  logo: string;
  tagline: string;
  projectCount: number;
  established: number;
  rating: number;
}

export interface MarketInsight {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: "up" | "down" | "stable";
  category: "price" | "rental" | "demand" | "builder";
}

export interface AISearchSuggestion {
  id: string;
  text: string;
  category: string;
}

export interface ComparisonFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface InvestmentMetric {
  id: string;
  label: string;
  value: string;
  insight: string;
}

export interface WhyPropAI {
  id: string;
  title: string;
  description: string;
}
