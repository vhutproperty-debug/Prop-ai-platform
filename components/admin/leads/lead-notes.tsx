"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addLeadNoteAction } from "@/actions/admin/leads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { LeadNote } from "@/types/lead";

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: LeadNote[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const sorted = [...notes].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      await addLeadNoteAction({ leadId, content: content.trim() });
      setContent("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Add an internal note..."
        />
        <Button type="submit" variant="accent" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Add Note"}
        </Button>
      </form>

      <div className="space-y-4">
        {sorted.length ? (
          sorted.map((note, index) => (
            <div
              key={note._id ?? index}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <p className="text-sm leading-relaxed">{note.content}</p>
              <p className="mt-2 text-xs text-muted">
                {note.authorName ?? "Agent"} ·{" "}
                {new Date(note.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">No notes yet.</p>
        )}
      </div>
    </div>
  );
}
