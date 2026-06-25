import type { KnowledgePack } from "@/types/content-research";

export const factValidatorService = {
  validate(pack: KnowledgePack): string[] {
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

    return errors;
  },

  getReviewFlags(pack: KnowledgePack) {
    return pack.verifiedFacts.filter((f) => f.requiresReview);
  },
};
