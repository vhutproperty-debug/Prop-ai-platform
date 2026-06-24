"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) => Promise<void>;
  showFeatured?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onAction,
  showFeatured = true,
}: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition();

  if (selectedCount === 0) return null;

  function run(
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    startTransition(async () => {
      await onAction(action);
      onClear();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-accent-muted px-4 py-3">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run("publish")}
      >
        Publish
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run("unpublish")}
      >
        Unpublish
      </Button>
      {showFeatured ? (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run("feature")}
          >
            Feature
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run("unfeature")}
          >
            Unfeature
          </Button>
        </>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => run("delete")}
      >
        Delete
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
