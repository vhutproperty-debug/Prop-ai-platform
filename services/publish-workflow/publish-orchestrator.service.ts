import { revalidatePath } from "next/cache";
import { PUBLISH_CONTENT_CLUSTER } from "@/config/publish-workflow";
import type { ContentType } from "@/config/content-engine";
import { withDatabase } from "@/lib/db/with-database";
import { NotFoundError } from "@/lib/errors";
import { projectCanonicalPath } from "@/lib/seo/urls";
import { truncateDescription } from "@/lib/seo/urls";
import { createJobLogger } from "@/lib/ingestion/logger";
import { ImportJob } from "@/models/ImportJob";
import { ImportRecord } from "@/models/ImportRecord";
import { ImportLog } from "@/models/ImportLog";
import { Project } from "@/models/Project";
import { ContentArticle } from "@/models/ContentArticle";
import type { NormalizedImportBundle } from "@/types/ingestion";
import { publishBundle } from "@/services/publishing/publishing.service";
import { contentJobService } from "@/services/content-engine/jobs/content-job.service";
import { contentPublishingService } from "@/services/content-engine/publishing/content-publishing.service";
import { embeddingService } from "@/services/embedding.service";
import { projectPageService } from "@/services/project-page.service";

export interface PublishImportResult {
  record: Record<string, unknown>;
  projectId: string;
  projectSlug: string;
  contentCluster: {
    jobId?: string;
    articleIds: string[];
    publishedSlugs: string[];
    errors: string[];
  };
  seoUpdated: boolean;
  indexed: boolean;
}

async function ensureProjectSeo(projectId: string) {
  return withDatabase(async () => {
    const project = await Project.findById(projectId).lean();
    if (!project) throw new NotFoundError("Project");

    const locationLabel = project.locationName ?? project.microMarket ?? "Mumbai";
    const seoTitle =
      project.seoTitle ??
      `${project.projectName} — ${locationLabel} | Prop AI`;
    const seoDescription =
      project.seoDescription ??
      truncateDescription(
        project.description ??
          project.tagline ??
          `${project.projectName} by ${project.builderName} in ${locationLabel}. Explore pricing, configurations, amenities, and RERA on Prop AI.`,
        160
      );

    if (project.seoTitle && project.seoDescription) {
      return { updated: false, slug: project.slug };
    }

    await Project.findByIdAndUpdate(projectId, {
      $set: { seoTitle, seoDescription },
    });

    return { updated: true, slug: project.slug };
  });
}

async function indexProjectForSearch(projectId: string, projectSlug: string) {
  try {
    const page = await projectPageService.getBySlug(projectSlug);

    const content = [
      page.projectName,
      page.builderName,
      page.description,
      page.tagline,
      page.locationName,
      page.microMarket,
      ...page.configurations.map((c) => c.name),
      ...page.amenities.map((a) => a.name),
    ]
      .filter(Boolean)
      .join(" ");

    await embeddingService.upsert("project", projectId, content, {
      slug: page.slug,
      projectName: page.projectName,
    });

    return true;
  } catch {
    return false;
  }
}

async function generateAndPublishContentCluster(
  projectId: string,
  reviewedBy: string
) {
  const contentTypes = PUBLISH_CONTENT_CLUSTER.map((item) => item.type);
  const result = {
    jobId: undefined as string | undefined,
    articleIds: [] as string[],
    publishedSlugs: [] as string[],
    errors: [] as string[],
  };

  try {
    const jobResult = await contentJobService.runGenerationJob({
      projectId,
      contentTypes,
      quantityPerType: 1,
      createdBy: reviewedBy,
    });

    result.jobId = jobResult.jobId;
    result.articleIds = jobResult.articleIds;
    result.errors.push(...jobResult.errors);

    for (const articleId of jobResult.articleIds) {
      try {
        await contentPublishingService.approve(articleId, reviewedBy);
        const published = await contentPublishingService.publish(
          articleId,
          reviewedBy
        );
        if (published?.slug) {
          result.publishedSlugs.push(String(published.slug));
          await embeddingService.upsert(
            "article",
            articleId,
            `${published.title} ${published.introduction ?? ""}`,
            { slug: published.slug, projectSlug: published.projectSlug }
          );
        }
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error.message : "Article publish failed"
        );
      }
    }
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Content cluster generation failed"
    );
  }

  return result;
}

function revalidatePublishedPaths(projectSlug: string, articleSlugs: string[]) {
  revalidatePath(projectCanonicalPath(projectSlug));
  revalidatePath("/admin/imports");
  revalidatePath("/admin/imports/review");
  revalidatePath("/admin/content");
  revalidatePath("/admin/content/articles");
  revalidatePath("/api/sitemap");
  revalidatePath("/api/content/sitemap");
  for (const slug of articleSlugs) {
    revalidatePath(`/articles/${slug}`);
  }
}

export const publishOrchestratorService = {
  async publishImportRecord(
    recordId: string,
    reviewedBy: string
  ): Promise<PublishImportResult> {
    const record = await withDatabase(() => ImportRecord.findById(recordId));
    if (!record) throw new NotFoundError("Import record");

    if (record.status === "published" && record.publishedId) {
      const project = await withDatabase(() =>
        Project.findById(record.publishedId).select("slug").lean()
      );
      const articles = await withDatabase(() =>
        ContentArticle.find({
          projectId: record.publishedId,
          status: "published",
        })
          .select("slug")
          .lean()
      );

      return {
        record: record.toObject() as Record<string, unknown>,
        projectId: String(record.publishedId),
        projectSlug: String(project?.slug ?? record.slug),
        contentCluster: {
          articleIds: [],
          publishedSlugs: articles.map((a) => String(a.slug)),
          errors: [],
        },
        seoUpdated: false,
        indexed: false,
      };
    }

    if (
      !["approved", "staged", "update"].includes(record.status)
    ) {
      throw new Error(`Cannot publish record with status: ${record.status}`);
    }

    const bundle = record.stagedData as NormalizedImportBundle;
    const logger = createJobLogger(bundle.source, String(record.jobId));
    const isUpdate =
      record.recordType === "update" || record.status === "update";

    const projectId = await publishBundle(bundle, logger, {
      existingProjectId: record.existingProjectId
        ? String(record.existingProjectId)
        : undefined,
      isUpdate,
      publishActive: true,
    });

    const seo = await ensureProjectSeo(projectId);
    const indexed = await indexProjectForSearch(projectId, seo.slug);

    const contentCluster = await generateAndPublishContentCluster(
      projectId,
      reviewedBy
    );

    const updated = await withDatabase(() =>
      ImportRecord.findByIdAndUpdate(
        recordId,
        {
          status: "published",
          publishedId: projectId,
          reviewedBy,
          reviewedAt: new Date(),
        },
        { new: true }
      ).lean()
    );

    await withDatabase(() =>
      ImportJob.findByIdAndUpdate(record.jobId, {
        $inc: {
          publishedCount: 1,
          ...(isUpdate ? { projectsUpdated: 1 } : { projectsImported: 1 }),
        },
      })
    );

    await withDatabase(() =>
      ImportLog.create({
        jobId: record.jobId,
        recordId: record._id,
        level: "success",
        message: `Published project with ${contentCluster.publishedSlugs.length} articles`,
        projectSlug: seo.slug,
        meta: {
          projectId,
          articleCount: contentCluster.publishedSlugs.length,
          contentErrors: contentCluster.errors.length,
        },
      })
    );

    revalidatePublishedPaths(seo.slug, contentCluster.publishedSlugs);

    return {
      record: (updated ?? record.toObject()) as Record<string, unknown>,
      projectId,
      projectSlug: seo.slug,
      contentCluster,
      seoUpdated: seo.updated,
      indexed,
    };
  },

  getClusterContentTypes(): ContentType[] {
    return PUBLISH_CONTENT_CLUSTER.map((item) => item.type);
  },
};
