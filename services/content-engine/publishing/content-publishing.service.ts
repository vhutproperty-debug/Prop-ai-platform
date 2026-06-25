import type { DuplicateIntelligenceResult, VerifiedFact } from "@/types/content-research";
import type { ContentType } from "@/config/content-engine";
import type { GeneratedArticlePayload, ContentSourceContext } from "@/types/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { ContentArticle } from "@/models/ContentArticle";
import { ContentVersion } from "@/models/ContentVersion";
import { ContentAuditLog } from "@/models/ContentAuditLog";
import { seoEngineService } from "@/services/content-engine/seo/seo-engine.service";
import { internalLinkingService } from "@/services/content-engine/seo/internal-linking.service";

export const contentPublishingService = {
  async saveDraft(input: {
    payload: GeneratedArticlePayload;
    context: ContentSourceContext;
    contentType: ContentType;
    campaignId?: string;
    authorId?: string;
    jobId?: string;
    knowledgePackId?: string;
    lowConfidenceFacts?: VerifiedFact[];
    researchCompleteness?: number;
    duplicateWarnings?: DuplicateIntelligenceResult[];
  }) {
    const enriched = await internalLinkingService.enrichLinks(input.payload, input.context);
    const seo = seoEngineService.buildMeta(enriched, enriched.slug);
    const analysis = seoEngineService.analyze(enriched);
    const needsReview =
      (input.lowConfidenceFacts?.length ?? 0) > 0 ||
      (input.duplicateWarnings?.some((d) => d.severity === "medium") ?? false);

    return withDatabase(async () => {
      const article = await ContentArticle.create({
        title: enriched.title,
        slug: enriched.slug,
        contentType: input.contentType,
        status: needsReview ? "pending_review" : "draft",
        sourceType: input.context.sourceType,
        sourceId: input.context.sourceId,
        projectId: input.context.project?.id,
        builderId: input.context.builder?.id,
        locationId: input.context.locality?.id,
        projectSlug: input.context.project?.slug,
        builderSlug: input.context.builder?.slug ?? input.context.project?.builderSlug,
        localitySlug: input.context.locality?.slug ?? input.context.project?.locationSlug,
        authorId: input.authorId,
        authorType: "ai",
        isAiGenerated: true,
        isHumanEdited: false,
        featuredSummary: enriched.featuredSummary,
        introduction: enriched.introduction,
        sections: enriched.sections,
        tableOfContents: enriched.tableOfContents,
        faqs: enriched.faqs,
        callToAction: enriched.callToAction,
        ...seo,
        schemaData: seoEngineService.buildArticleSchema(enriched, input.context),
        internalLinks: enriched.internalLinks,
        externalReferences: enriched.externalReferences,
        relatedProjects: enriched.relatedProjects,
        relatedBuilders: enriched.relatedBuilders,
        relatedLocalities: enriched.relatedLocalities,
        relatedArticles: enriched.relatedArticles ?? [],
        imageSuggestions: enriched.imageSuggestions,
        imagePrompts: enriched.imagePrompts,
        featuredImageSuggestion: enriched.imageSuggestions[0]?.prompt,
        gallerySuggestions: enriched.imagePrompts,
        socialCaption: enriched.socialCaption,
        newsletterSummary: enriched.newsletterSummary,
        keywords: enriched.keywords,
        keywordDensity: analysis.keywordDensity,
        readabilityScore: analysis.readabilityScore,
        seoScore: analysis.seoScore,
        campaignId: input.campaignId,
        version: 1,
        knowledgePackId: input.knowledgePackId,
        lowConfidenceFacts: input.lowConfidenceFacts ?? [],
        researchCompleteness: input.researchCompleteness,
        duplicateWarnings: input.duplicateWarnings ?? [],
      });

      await ContentVersion.create({
        articleId: article._id,
        version: 1,
        snapshot: article.toObject(),
        changedBy: input.authorId,
        changeReason: "Initial AI generation",
      });

      await ContentAuditLog.create({
        articleId: article._id,
        jobId: input.jobId,
        action: "generated",
        actorId: input.authorId,
        meta: {
          contentType: input.contentType,
          knowledgePackId: input.knowledgePackId,
          researchCompleteness: input.researchCompleteness,
          lowConfidenceCount: input.lowConfidenceFacts?.length ?? 0,
        },
      });

      return article;
    });
  },

  async createVersion(articleId: string, changedBy?: string, reason?: string) {
    return withDatabase(async () => {
      const article = await ContentArticle.findById(articleId);
      if (!article) throw new Error("Article not found");

      const nextVersion = (article.version ?? 1) + 1;
      await ContentVersion.create({
        articleId: article._id,
        version: nextVersion,
        snapshot: article.toObject(),
        changedBy,
        changeReason: reason ?? "Manual edit",
      });

      article.version = nextVersion;
      await article.save();

      await ContentAuditLog.create({
        articleId: article._id,
        action: "version_created",
        actorId: changedBy,
        meta: { version: nextVersion },
      });

      return nextVersion;
    });
  },

  async approve(articleId: string, actorId?: string) {
    return withDatabase(async () => {
      const article = await ContentArticle.findByIdAndUpdate(
        articleId,
        { status: "approved" },
        { new: true }
      ).lean();
      await ContentAuditLog.create({
        articleId,
        action: "approved",
        actorId,
      });
      return article;
    });
  },

  async publish(articleId: string, actorId?: string) {
    return withDatabase(async () => {
      const article = await ContentArticle.findByIdAndUpdate(
        articleId,
        { status: "published", publishedAt: new Date(), isActive: true },
        { new: true }
      ).lean();
      await ContentAuditLog.create({
        articleId,
        action: "published",
        actorId,
      });
      return article;
    });
  },

  async archive(articleId: string, actorId?: string) {
    return withDatabase(async () => {
      const article = await ContentArticle.findByIdAndUpdate(
        articleId,
        { status: "archived", isActive: false },
        { new: true }
      ).lean();
      await ContentAuditLog.create({
        articleId,
        action: "archived",
        actorId,
      });
      return article;
    });
  },

  async republish(articleId: string, actorId?: string) {
    await this.createVersion(articleId, actorId, "Republish");
    return this.publish(articleId, actorId);
  },
};
