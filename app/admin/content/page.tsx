import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { ContentEngineMetrics } from "@/components/admin/content/content-engine-metrics";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contentDashboardService } from "@/services/content-engine/analytics/content-dashboard.service";
import { contentJobService } from "@/services/content-engine/jobs/content-job.service";

export const dynamic = "force-dynamic";

export default async function ContentEngineDashboardPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const [metrics, jobs] = await Promise.all([
    contentDashboardService.getMetrics(),
    contentJobService.listJobs(1, 5),
  ]);

  const quickLinks = [
    { href: "/admin/content/generate", label: "Generate Content" },
    { href: "/admin/content/intelligence", label: "Intelligence" },
    { href: "/admin/content/articles", label: "All Articles" },
    { href: "/admin/content/review", label: "Review Queue" },
    { href: "/admin/content/schedule", label: "Scheduling" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Content Engine</h1>
        <p className="mt-1 text-sm text-muted">
          Research-first AI content platform — generate, review, schedule, and publish.
        </p>
      </div>

      <ContentEngineMetrics metrics={metrics} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-3xl border border-border bg-white p-6 text-sm font-medium transition-colors hover:bg-muted/10"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Generation Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {jobs.items.length === 0 ? (
            <p className="text-muted">No generation jobs yet.</p>
          ) : (
            jobs.items.map((job) => (
              <div
                key={String(job._id)}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0"
              >
                <span>
                  {job.type} · {job.articlesCreated ?? 0} created
                </span>
                <span className="text-muted">{job.status}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
