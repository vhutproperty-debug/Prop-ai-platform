import { slugify } from "@/lib/utils";
import type { StagedConfiguration, StagedProjectBundle } from "@/types/ingestion";

export function generateProjectSlug(
  builderName: string,
  projectName: string
): string {
  return slugify(`${builderName}-${projectName}`);
}

export function generateBuilderSlug(name: string): string {
  return slugify(name);
}

export function generateLocationSlug(name: string, city = "Mumbai"): string {
  return slugify(`${name}-${city}`);
}

export function generateConfigurationSlug(
  projectSlug: string,
  configName: string
): string {
  return slugify(`${projectSlug}-${configName}`);
}

export function normalizeAmenityName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function dedupeAmenities(amenities: string[]): string[] {
  const seen = new Set<string>();
  return amenities
    .map(normalizeAmenityName)
    .filter((a) => {
      const key = a.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function mergePriceRanges(
  ranges: Array<{ min: number; max: number }>
): { min: number; max: number; currency: string } {
  if (!ranges.length) {
    return { min: 0, max: 0, currency: "INR" };
  }
  return {
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
    currency: "INR",
  };
}

export function ensureConfigurations(
  configs: StagedConfiguration[],
  projectSlug: string
): StagedConfiguration[] {
  return configs.map((config) => ({
    ...config,
    slug: config.slug || generateConfigurationSlug(projectSlug, config.name),
    priceRange: {
      ...config.priceRange,
      currency: config.priceRange.currency ?? "INR",
    },
  }));
}

export function stripMarketingFields(
  bundle: StagedProjectBundle,
  allowDescription: boolean
): StagedProjectBundle {
  const cleaned = { ...bundle };
  if (!allowDescription) {
    delete cleaned.description;
    delete cleaned.tagline;
  }
  return cleaned;
}
