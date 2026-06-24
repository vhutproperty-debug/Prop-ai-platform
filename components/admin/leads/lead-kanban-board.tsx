"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { LeadStatus } from "@/config/constants";
import { updateLeadStatusAction } from "@/actions/admin/leads";
import {
  getScoreBadgeClass,
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/leads/labels";
import type { LeadKanbanColumn } from "@/types/lead";
import { cn } from "@/lib/utils";

export function LeadKanbanBoard({ columns }: { columns: LeadKanbanColumn[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDrop(status: LeadStatus, leadId: string) {
    startTransition(async () => {
      await updateLeadStatusAction(leadId, status);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "grid gap-4 overflow-x-auto pb-2 xl:grid-cols-7",
        isPending && "opacity-70"
      )}
    >
      {columns.map((column) => (
        <div
          key={column.status}
          className="min-w-[260px] rounded-3xl border border-border bg-white"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const leadId = e.dataTransfer.getData("leadId");
            if (leadId) handleDrop(column.status, leadId);
          }}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted">
                {column.count}
              </span>
            </div>
          </div>
          <div className="max-h-[65vh] space-y-3 overflow-y-auto p-3">
            {column.leads.map((lead) => (
              <div
                key={lead._id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("leadId", lead._id)}
                className="cursor-grab rounded-2xl border border-border bg-background p-3 active:cursor-grabbing"
              >
                <Link href={`/admin/leads/${lead._id}`} className="block">
                  <p className="font-medium">{lead.name}</p>
                  <p className="mt-1 text-xs text-muted">{lead.phone}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                        getScoreBadgeClass(lead.score)
                      )}
                    >
                      {LEAD_SCORE_LABELS[lead.score]}
                    </span>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] text-muted">
                      {LEAD_SOURCE_LABELS[lead.source]}
                    </span>
                  </div>
                  {lead.projectSlug ? (
                    <p className="mt-2 truncate text-xs text-accent">
                      {lead.projectSlug}
                    </p>
                  ) : null}
                </Link>
              </div>
            ))}
            {column.count > column.leads.length ? (
              <p className="px-1 text-center text-xs text-muted">
                +{column.count - column.leads.length} more
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
