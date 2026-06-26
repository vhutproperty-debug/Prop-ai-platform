import {
  isAiConfigured,
  isAuthConfigured,
  isCloudinaryConfigured,
  isDbConfigured,
  isFirecrawlConfigured,
} from "@/config/env";
import { databaseHealthService } from "@/services/database/health.service";
import type { PlatformServiceHealth, ServiceHealthStatus } from "@/types/mission-control";
import { withDatabase } from "@/lib/db/with-database";
import { ContentJob } from "@/models/ContentJob";
import { ImportJob } from "@/models/ImportJob";

function statusFromConfigured(configured: boolean): ServiceHealthStatus {
  return configured ? "online" : "warning";
}

export const platformHealthService = {
  async getAll(): Promise<PlatformServiceHealth[]> {
    const [dbHealth, failedImports, runningJobs, failedContentJobs] =
      await Promise.all([
        isDbConfigured
          ? databaseHealthService.check({ includeCollections: false })
          : null,
        withDatabase(() =>
          ImportJob.countDocuments({ status: "failed" })
        ).catch(() => 0),
        withDatabase(() =>
          ImportJob.countDocuments({
            status: { $in: ["queued", "running", "extracting", "normalizing"] },
          })
        ).catch(() => 0),
        withDatabase(() =>
          ContentJob.countDocuments({ status: "failed" })
        ).catch(() => 0),
      ]);

    const mongoStatus: ServiceHealthStatus = !isDbConfigured
      ? "offline"
      : dbHealth?.mongodb.status === "healthy"
        ? "online"
        : dbHealth?.mongodb.status === "not_configured"
          ? "offline"
          : "warning";

    const backgroundJobs: ServiceHealthStatus =
      failedImports > 5 || failedContentJobs > 5
        ? "warning"
        : runningJobs > 0
          ? "online"
          : "online";

    return [
      {
        id: "application",
        label: "Application",
        status: "online",
        detail: "Next.js app running",
      },
      {
        id: "mongodb",
        label: "MongoDB Atlas",
        status: mongoStatus,
        detail: dbHealth?.mongodb.databaseName ?? "Not configured",
      },
      {
        id: "firecrawl",
        label: "Firecrawl",
        status: statusFromConfigured(isFirecrawlConfigured),
        detail: isFirecrawlConfigured ? "API key configured" : "Missing API key",
      },
      {
        id: "openai",
        label: "OpenAI",
        status: statusFromConfigured(isAiConfigured),
        detail: isAiConfigured ? "API key configured" : "Template fallback mode",
      },
      {
        id: "cloudinary",
        label: "Cloudinary",
        status: statusFromConfigured(isCloudinaryConfigured),
        detail: isCloudinaryConfigured ? "Media upload ready" : "Not configured",
      },
      {
        id: "search",
        label: "Search Engine",
        status: isDbConfigured ? "online" : "offline",
        detail: "Keyword + embedding-ready index",
      },
      {
        id: "background_jobs",
        label: "Background Jobs",
        status: backgroundJobs,
        detail: `${runningJobs} running · ${failedImports + failedContentJobs} failed`,
      },
      {
        id: "scheduler",
        label: "Scheduler",
        status: "warning",
        detail: "Cron wiring planned — manual triggers active",
      },
      {
        id: "email",
        label: "Email Service",
        status: "offline",
        detail: "Not configured",
      },
      {
        id: "storage",
        label: "Storage",
        status: isCloudinaryConfigured || isDbConfigured ? "online" : "warning",
        detail: isCloudinaryConfigured ? "Cloudinary + MongoDB" : "MongoDB only",
      },
      {
        id: "auth",
        label: "Authentication",
        status: isAuthConfigured ? "online" : "offline",
        detail: isAuthConfigured ? "JWT sessions active" : "JWT not configured",
      },
    ];
  },
};
