"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  approveContentAction,
  publishContentAction,
  rejectContentAction,
  submitContentForReviewAction,
} from "@/actions/admin/content";
import { CONTENT_TYPE_LABELS } from "@/config/content-engine";
import type { ContentType } from "@/config/content-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleRow {
  _id: string;
  title: string;
  slug: string;
  contentType: ContentType;
  status: string;
  seoScore?: number;
  projectSlug?: string;
  isAiGenerated: boolean;
  isHumanEdited: boolean;
}

export function ContentArticleTable({ rows }: { rows: ArticleRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(
    id: string,
    action: "approve" | "reject" | "publish" | "review"
  ) {
    setPendingId(id);
    setError(null);
    let result;
    if (action === "approve") result = await approveContentAction(id);
    else if (action === "reject") result = await rejectContentAction(id);
    else if (action === "publish") result = await publishContentAction(id);
    else result = await submitContentForReviewAction(id);
    setPendingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!rows.length) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-muted">
        No articles found.
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
      {rows.map((row) => (
        <Card key={row._id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{row.title}</CardTitle>
              <p className="mt-1 text-sm text-muted">{row.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{CONTENT_TYPE_LABELS[row.contentType]}</Badge>
              <Badge variant="outline">{row.status}</Badge>
              {row.seoScore != null && (
                <Badge variant="outline">SEO {row.seoScore}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted">
              {row.isAiGenerated && <span>AI</span>}
              {row.isHumanEdited && <span className="ml-2">Edited</span>}
              {row.projectSlug && (
                <span className="ml-2">Project: {row.projectSlug}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/content/articles/${row._id}`}
                className="text-sm text-accent hover:underline"
              >
                View
              </Link>
              {row.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingId === row._id}
                  onClick={() => handle(row._id, "review")}
                >
                  Submit for Review
                </Button>
              )}
              {["pending_review", "draft"].includes(row.status) && (
                <>
                  <Button
                    size="sm"
                    disabled={pendingId === row._id}
                    onClick={() => handle(row._id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId === row._id}
                    onClick={() => handle(row._id, "reject")}
                  >
                    Reject
                  </Button>
                </>
              )}
              {row.status === "approved" && (
                <Button
                  size="sm"
                  variant="accent"
                  disabled={pendingId === row._id}
                  onClick={() => handle(row._id, "publish")}
                >
                  Publish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
