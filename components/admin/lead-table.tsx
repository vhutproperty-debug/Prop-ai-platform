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
    <div className="overflow-hidden rounded-3xl border border-border bg-white">
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
                  className="rounded-full border border-border px-3 py-1 text-xs"
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
  );
}
