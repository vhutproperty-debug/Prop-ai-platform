import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportReviewPanel } from "@/components/admin/import-review-panel";
import { Badge } from "@/components/ui/badge";
import { importReviewService } from "@/services/import-review.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ImportJobReviewPage({ params }: PageProps) {
  const { id } = await params;

  let job;
  let records;
  try {
    [job, records] = await Promise.all([
      importReviewService.getJob(id),
      importReviewService.getJobRecords(id),
    ]);
  } catch {
    notFound();
  }

  const serializedRecords = records.map((r) => ({
    _id: String(r._id),
    slug: r.slug,
    displayName: r.displayName,
    status: r.status,
    duplicates: (r.duplicates ?? []) as Array<{
      type: string;
      message: string;
      confidence: number;
    }>,
    validationErrors: r.validationErrors ?? [],
    stagedData: r.stagedData as {
      project: {
        builderName: string;
        projectName: string;
        locationName: string;
        priceRange: { min: number; max: number };
        reraNumber?: string;
        configurations: Array<{ name: string; type: string }>;
        amenities: string[];
      };
      metadata: { fieldsExtracted: string[]; copyrightSafe: boolean };
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/imports" className="text-sm text-muted hover:text-foreground">
          ← Back to imports
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Review Import Job
        </h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
          <span>Source: {job.source}</span>
          <Badge variant="outline">{job.status}</Badge>
          <span>{job.recordCount} records</span>
          {job.fileName && <span>File: {job.fileName}</span>}
        </div>
      </div>

      <ImportReviewPanel records={serializedRecords} />
    </div>
  );
}
