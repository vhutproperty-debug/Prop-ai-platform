import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { ImportReviewQueue } from "@/components/admin/import-review-queue";
import { reviewService } from "@/services/review/review.service";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ImportReviewPage({ searchParams }: PageProps) {
  const { tab = "all" } = await searchParams;

  if (!isDbConfigured) {
    return (
      <p className="text-muted">Configure MONGODB_URI to enable the review queue.</p>
    );
  }

  const recordType =
    tab === "new" || tab === "update" || tab === "duplicate" || tab === "conflict"
      ? tab
      : undefined;

  const { items, counts } = await reviewService.listReviewQueue({
    recordType,
    limit: 100,
  });

  const serializedRecords = items.map((r) => ({
    _id: String(r._id),
    slug: r.slug,
    displayName: r.displayName,
    status: r.status,
    recordType: r.recordType as string | undefined,
    existingProjectId: r.existingProjectId
      ? String(r.existingProjectId)
      : undefined,
    duplicates: (r.duplicates ?? []).map(
      (d: {
        type: string;
        message: string;
        confidence: number;
        existingId?: string;
      }) => ({
      type: d.type,
      message: d.message,
      confidence: d.confidence,
      existingId: d.existingId,
    })),
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
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Import Review Queue</h1>
        <p className="mt-1 text-sm text-muted">
          Approve, reject, or merge staged projects before publishing.
        </p>
      </div>

      <ImportReviewQueue
        records={serializedRecords}
        counts={counts}
        activeTab={
          tab === "new" || tab === "update" || tab === "duplicate" || tab === "conflict"
            ? tab
            : "all"
        }
      />
    </div>
  );
}
