import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { ImportUploadForm } from "@/components/admin/import-upload-form";
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

  const { items: jobs } = await importReviewService.listJobs(1, 50);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Data Ingestion</h1>
        <p className="mt-1 text-sm text-muted">
          Copyright-safe structured import pipeline with admin review before publishing.
        </p>
      </div>

      <ImportUploadForm />

      <div className="overflow-hidden rounded-3xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Duplicates</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted">
                  No import jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={String(job._id)}>
                  <TableCell className="font-medium">{job.source}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>
                  <TableCell>{job.recordCount}</TableCell>
                  <TableCell>{job.duplicateCount}</TableCell>
                  <TableCell>{job.publishedCount}</TableCell>
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
