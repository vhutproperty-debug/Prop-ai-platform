import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { ImportUploadForm } from "@/components/admin/import-upload-form";
import { FirecrawlImportForm } from "@/components/admin/firecrawl-import-form";
import { ImportMetrics } from "@/components/admin/import-metrics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importReviewService } from "@/services/import-review.service";
import { reviewService } from "@/services/review/review.service";

export default async function AdminImportsPage() {
  if (!isDbConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion</CardTitle>
        </CardHeader>
        <CardContent className="text-muted">
          Configure MONGODB_URI to enable the ingestion pipeline.
        </CardContent>
      </Card>
    );
  }

  const [{ items: jobs }, metrics] = await Promise.all([
    importReviewService.listJobs(1, 50),
    reviewService.getMetrics(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Data Ingestion</h1>
          <p className="mt-1 text-sm text-muted">
            Firecrawl-powered builder imports with admin review before publishing.
          </p>
        </div>
        <Link
          href="/admin/imports/review"
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted/10"
        >
          Review Queue ({metrics.pendingReviews})
        </Link>
      </div>

      <ImportMetrics metrics={metrics} />

      <FirecrawlImportForm />

      <ImportUploadForm />

      <div className="overflow-hidden rounded-3xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Builder</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Failures</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted">
                  No import jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={String(job._id)}>
                  <TableCell className="font-medium">{job.source}</TableCell>
                  <TableCell>{job.builder ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell>{job.projectsImported ?? job.recordCount}</TableCell>
                  <TableCell>{job.projectsUpdated ?? 0}</TableCell>
                  <TableCell>{job.errorCount}</TableCell>
                  <TableCell className="text-xs text-muted">
                    {new Date(job.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/imports/${job._id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      Review
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
