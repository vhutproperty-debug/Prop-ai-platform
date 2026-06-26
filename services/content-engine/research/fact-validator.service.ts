import type { KnowledgePack } from "@/types/content-research";
import type { ContentType } from "@/config/content-engine";
import { POI_REQUIRED_CONTENT_TYPES } from "@/config/location-intelligence";

export const factValidatorService = {
  validate(pack: KnowledgePack, contentType?: ContentType): string[] {
    const errors: string[] = [];

    if (!pack.verifiedFacts.length) {
      errors.push("Knowledge pack has no verified facts");
    }

    const hasProjectOrEntity =
      pack.projectId || pack.builderId || pack.localityId;
    if (!hasProjectOrEntity) {
      errors.push("Knowledge pack missing entity reference");
    }

    const hasName = pack.verifiedFacts.some(
      (f) => f.key === "project_name" || f.key === "builder_name"
    );
    if (!hasName) {
      errors.push("Cannot generate without project or builder name fact");
    }

    if (pack.dataCompleteness < 30) {
      errors.push(
        `Insufficient structured data (completeness: ${pack.dataCompleteness}%)`
      );
    }

  const lowConfidenceCritical = pack.verifiedFacts.filter(
      (f) =>
        f.requiresReview &&
        ["rera", "price_range", "possession"].includes(f.key)
    );
    if (lowConfidenceCritical.length >= 2) {
      errors.push(
        `${lowConfidenceCritical.length} critical facts flagged for review`
      );
    }

    if (contentType && POI_REQUIRED_CONTENT_TYPES[contentType]) {
      const required = POI_REQUIRED_CONTENT_TYPES[contentType] ?? [];
      const available = new Set(pack.nearbyInfrastructure.map((p) => p.type));
      const missing = required.filter((type) => !available.has(type));
      if (missing.length) {
        errors.push(
          `Missing nearby ${missing.join(", ")} data for ${contentType.replace(/_/g, " ")}`
        );
      }
    }

    return errors;
  },

  getReviewFlags(pack: KnowledgePack) {
    return pack.verifiedFacts.filter((f) => f.requiresReview);
  },
};
