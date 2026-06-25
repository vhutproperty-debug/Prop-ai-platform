"use server";

import { runAdminAction } from "@/actions/admin/helpers";
import { requireRole } from "@/lib/auth/session";
import { contentArticleService } from "@/services/content-engine/articles/content-article.service";
import { contentJobService } from "@/services/content-engine/jobs/content-job.service";
import { contentPublishingService } from "@/services/content-engine/publishing/content-publishing.service";
import { contentSchedulingService } from "@/services/content-engine/scheduling/content-scheduling.service";
import {
  contentFilterSchema,
  contentGenerationSchema,
  contentScheduleSchema,
} from "@/validations/content-engine";

const CONTENT_PATHS = [
  "/admin/content",
  "/admin/content/articles",
  "/admin/content/review",
  "/admin/content/schedule",
  "/admin/content/generate",
];

export async function generateContentAction(input: unknown) {
  return runAdminAction(async () => {
    const session = await requireRole("admin");
    const data = contentGenerationSchema.parse(input);
    return contentJobService.runGenerationJob({
      ...data,
      createdBy: session.userId,
    });
  }, CONTENT_PATHS);
}

export async function approveContentAction(articleId: string) {
  return runAdminAction(
    async () => {
      const session = await requireRole("admin", "agent");
      return contentPublishingService.approve(articleId, session.userId);
    },
    CONTENT_PATHS,
    ["admin", "agent"]
  );
}

export async function publishContentAction(articleId: string) {
  return runAdminAction(async () => {
    const session = await requireRole("admin");
    return contentPublishingService.publish(articleId, session.userId);
  }, CONTENT_PATHS);
}

export async function scheduleContentAction(input: unknown) {
  return runAdminAction(async () => {
    const session = await requireRole("admin");
    const data = contentScheduleSchema.parse(input);
    return contentSchedulingService.schedule({
      articleId: data.articleId,
      scheduledAt: new Date(data.scheduledAt),
      priority: data.priority,
      campaignId: data.campaignId,
      actorId: session.userId,
    });
  }, CONTENT_PATHS);
}

export async function rejectContentAction(articleId: string) {
  return runAdminAction(
    async () => contentArticleService.update(articleId, { status: "draft" }),
    CONTENT_PATHS,
    ["admin", "agent"]
  );
}

export async function submitContentForReviewAction(articleId: string) {
  return runAdminAction(
    async () => contentArticleService.submitForReview(articleId),
    CONTENT_PATHS,
    ["admin", "agent"]
  );
}

export async function listContentAction(filters: unknown) {
  return runAdminAction(
    async () => {
      const data = contentFilterSchema.parse(filters);
      return contentArticleService.list(data);
    },
    [],
    ["admin", "agent"]
  );
}

export async function processScheduledQueueAction() {
  return runAdminAction(async () => {
    const session = await requireRole("admin");
    return contentSchedulingService.processDueQueue(session.userId);
  }, CONTENT_PATHS);
}
