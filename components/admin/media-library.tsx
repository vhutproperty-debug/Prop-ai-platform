"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  bulkMediaAction,
  deleteMediaAction,
  uploadMultipleMediaAction,
} from "@/actions/admin/media";
import { isCloudinaryConfigured } from "@/config/env";
import { BulkActionsBar } from "@/components/admin/bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MediaRow {
  _id: string;
  url: string;
  alt?: string;
  publicId?: string;
  entityType: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

interface Option {
  _id: string;
  name: string;
}

export function MediaLibrary({
  items,
  projects,
}: {
  items: MediaRow[];
  projects: Option[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [entityId, setEntityId] = useState(projects[0]?._id ?? "");

  async function handleUpload() {
    const files = fileRef.current?.files;
    if (!files?.length || !entityId) {
      setError("Select files and a project.");
      return;
    }

    setError(null);
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    formData.set("entityType", "project");
    formData.set("entityId", entityId);
    formData.set("type", "gallery");

    startTransition(async () => {
      const result = await uploadMultipleMediaAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  async function handleBulk(
    action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
  ) {
    const result = await bulkMediaAction({ ids: [...selected], action });
    if (result.success) {
      setSelected(new Set());
      router.refresh();
    }
  }

  if (!isCloudinaryConfigured) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-muted">
        Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
        and CLOUDINARY_API_SECRET to enable media uploads.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">Upload Images</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="flex h-14 w-full rounded-2xl border border-border px-5"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Files</Label>
            <Input ref={fileRef} type="file" accept="image/*" multiple />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          variant="accent"
          className="mt-4"
          disabled={isPending}
          onClick={handleUpload}
        >
          {isPending ? "Uploading..." : "Upload to Cloudinary"}
        </Button>
      </div>

      <BulkActionsBar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        onAction={handleBulk}
        showFeatured={false}
      />

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-border bg-white"
            >
              <div className="relative aspect-[4/3]">
                <Image src={item.url} alt={item.alt ?? ""} fill className="object-cover" sizes="300px" />
                <input
                  type="checkbox"
                  className="absolute left-3 top-3"
                  checked={selected.has(item._id)}
                  onChange={() => {
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(item._id)) next.delete(item._id);
                      else next.add(item._id);
                      return next;
                    });
                  }}
                />
              </div>
              <div className="space-y-2 p-3 text-xs">
                <p className="font-medium">{item.entityType} · {item.type}</p>
                <p className="truncate text-muted">{item.publicId ?? item.url}</p>
                <button
                  type="button"
                  className="text-muted hover:text-foreground"
                  onClick={async () => {
                    await deleteMediaAction(item._id);
                    router.refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-border bg-white p-8 text-muted">
          No media uploaded yet.
        </p>
      )}
    </div>
  );
}
