import type { ContentType } from "@/config/content-engine";
import type {
  ResearchPipelineResult,
  KnowledgePack,
} from "@/types/content-research";
import { withDatabase } from "@/lib/db/with-database";
import { ContentKnowledgePack } from "@/models/ContentKnowledgePack";
import {
  internalResearchService,
  InsufficientDataError,
} from "@/services/content-engine/research/internal-research.service";
import { externalResearchRegistry } from "@/services/content-engine/research/external/connector.registry";
import { knowledgePackService } from "@/services/content-engine/research/knowledge-pack.service";
import { factValidatorService } from "@/services/content-engine/research/fact-validator.service";
import { duplicateIntelligenceService } from "@/services/content-engine/intelligence/duplicate-intelligence.service";

export const researchPipelineService = {
  async run(input: {
    projectId: string;
    contentType: ContentType;
    jobId?: string;
    createdBy?: string;
    skipDuplicateCheck?: boolean;
  }): Promise<ResearchPipelineResult> {
    let internal;
    try {
      internal = await internalResearchService.collectFromProject(input.projectId);
    } catch (error) {
      if (error instanceof InsufficientDataError) {
        return {
          knowledgePack: {} as KnowledgePack,
          validationErrors: [error.message],
          duplicateWarnings: [],
          blocked: true,
          blockReason: error.message,
        };
      }
      throw error;
    }

    const projectSlug = (internal.project as { slug?: string })?.slug;
    const builderSlug = (internal.builder as { slug?: string })?.slug;
    const localitySlug = (internal.locality as { slug?: string })?.slug;

    const external = await externalResearchRegistry.fetchAll({
      projectSlug,
      builderSlug,
      localitySlug,
    });

    const knowledgePack = knowledgePackService.build(
      input.contentType,
      internal,
      external
    );

    const validationErrors = factValidatorService.validate(knowledgePack);

    const duplicateWarnings = input.skipDuplicateCheck
      ? []
      : await duplicateIntelligenceService.analyze({
          contentType: input.contentType,
          projectSlug,
          keywords: knowledgePack.seoKeywords,
          faqs: knowledgePack.faqs,
          title: knowledgePack.verifiedFacts.find((f) => f.key === "project_name")?.value,
        });

    const highSeverityDup = duplicateWarnings.some((d) => d.severity === "high");
    const blocked =
      validationErrors.some((e) => e.includes("Insufficient")) || highSeverityDup;

    const saved = await withDatabase(() =>
      ContentKnowledgePack.create({
        projectId: input.projectId,
        builderId: knowledgePack.builderId,
        localityId: knowledgePack.localityId,
        contentType: input.contentType,
        jobId: input.jobId,
        pack: knowledgePack,
        verifiedFacts: knowledgePack.verifiedFacts,
        lowConfidenceCount: knowledgePack.lowConfidenceCount,
        dataCompleteness: knowledgePack.dataCompleteness,
        externalDataAvailable: knowledgePack.externalDataAvailable,
        sources: knowledgePack.sources,
        createdBy: input.createdBy,
      })
    );

    knowledgePack.id = String(saved._id);

    return {
      knowledgePack,
      validationErrors,
      duplicateWarnings,
      blocked,
      blockReason: blocked
        ? validationErrors[0] ?? duplicateWarnings.find((d) => d.severity === "high")?.message
        : undefined,
    };
  },
};
