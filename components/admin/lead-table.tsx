"use client";

import { useState } from "react";
import { LEAD_STATUSES } from "@/config/constants";
import { updateLeadAction, deleteLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeadRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
}

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  const [rows, setRows] = useState(leads);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    setPendingId(id);
    const result = await updateLeadAction({ id, status: status as (typeof LEAD_STATUSES)[number] });
    setPendingId(null);

    if (result.success) {
      setRows((current) =>
        current.map((lead) => (lead._id === id ? { ...lead, status } : lead))
      );
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    const result = await deleteLeadAction(id);
    setPendingId(null);

    if (result.success) {
      setRows((current) => current.filter((lead) => lead._id !== id));
    }
  }

  if (!rows.length) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-muted">
        No leads yet. Leads submitted via the API will appear here.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl border border-border bg-white lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lead) => (
              <TableRow key={lead._id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div>{lead.email}</div>
                  <div className="text-xs text-muted">{lead.phone}</div>
                </TableCell>
                <TableCell>
                  <select
                    value={lead.status}
                    disabled={pendingId === lead._id}
                    onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                    className="min-h-[44px] rounded-full border border-border px-3 py-1 text-xs"
                  >
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell className="text-xs text-muted">
                  {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === lead._id}
                    onClick={() => handleDelete(lead._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((lead) => (
          <div key={lead._id} className="rounded-2xl border border-border bg-white p-4">
            <p className="font-medium">{lead.name}</p>
            <p className="mt-1 text-sm text-muted">{lead.email}</p>
            <p className="text-sm text-muted">{lead.phone}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={lead.status}
                disabled={pendingId === lead._id}
                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                className="min-h-[44px] flex-1 rounded-full border border-border px-3 py-2 text-sm"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === lead._id}
                onClick={() => handleDelete(lead._id)}
              >
                Delete
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {lead.source} · {new Date(lead.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
