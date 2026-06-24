"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveImportRecordAction,
  publishImportRecordAction,
  rejectImportRecordAction,
} from "@/actions/imports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DuplicateMatch {
  type: string;
  message: string;
  confidence: number;
}

interface ImportRecordRow {
  _id: string;
  slug: string;
  displayName: string;
  status: string;
  duplicates: DuplicateMatch[];
  validationErrors: string[];
  stagedData: {
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
  };
}

export function ImportReviewPanel({ records }: { records: ImportRecordRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(
    recordId: string,
    action: "approve" | "reject" | "publish"
  ) {
    setPendingId(recordId);
    setError(null);

    let result;
    if (action === "approve") result = await approveImportRecordAction(recordId);
    else if (action === "reject") result = await rejectImportRecordAction(recordId);
    else result = await publishImportRecordAction(recordId);

    setPendingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (!records.length) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-muted">
        No records in this import job.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {records.map((record) => (
        <Card key={record._id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{record.displayName}</CardTitle>
              <p className="mt-1 text-sm text-muted">{record.slug}</p>
            </div>
            <Badge variant={record.status === "published" ? "accent" : "outline"}>
              {record.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <p className="text-muted">Builder</p>
                <p className="font-medium">{record.stagedData.project.builderName}</p>
              </div>
              <div>
                <p className="text-muted">Location</p>
                <p className="font-medium">{record.stagedData.project.locationName}</p>
              </div>
              <div>
                <p className="text-muted">Price Range</p>
                <p className="font-medium">
                  ₹{record.stagedData.project.priceRange.min.toLocaleString("en-IN")} — ₹
                  {record.stagedData.project.priceRange.max.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-muted">RERA</p>
                <p className="font-medium">
                  {record.stagedData.project.reraNumber ?? "—"}
                </p>
              </div>
            </div>

            {record.duplicates.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm">
                <p className="font-medium text-amber-900">Duplicate warnings</p>
                <ul className="mt-2 space-y-1 text-amber-800">
                  {record.duplicates.map((d, i) => (
                    <li key={i}>
                      [{d.type}] {d.message} ({Math.round(d.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {["staged", "update", "duplicate", "conflict"].includes(record.status) ? (
                <>
                  <Button
                    size="sm"
                    disabled={pendingId === record._id}
                    onClick={() => handleAction(record._id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId === record._id}
                    onClick={() => handleAction(record._id, "reject")}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {record.status === "approved" ? (
                <Button
                  size="sm"
                  variant="accent"
                  disabled={pendingId === record._id}
                  onClick={() => handleAction(record._id, "publish")}
                >
                  Publish to Database
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
