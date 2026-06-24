import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { LeadDetailForm } from "@/components/admin/leads/lead-detail-form";
import { LeadNotes } from "@/components/admin/leads/lead-notes";
import { LeadTimeline } from "@/components/admin/leads/lead-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDbConfigured } from "@/config/env";
import { NotFoundError } from "@/lib/errors";
import {
  LEAD_SCORE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/labels";
import type { Lead } from "@/types/lead";
import { adminLeadService } from "@/services/admin/leads.service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const { id } = await params;

  let lead: Lead;
  try {
    lead = await adminLeadService.getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const agents = await adminLeadService.listAgents();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={lead.name}
        description={`${LEAD_STATUS_LABELS[lead.status]} · ${LEAD_SCORE_LABELS[lead.score]} · ${LEAD_SOURCE_LABELS[lead.source]}`}
      />

      <LeadDetailForm lead={lead} agents={agents} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadTimeline activities={lead.activities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadNotes leadId={lead._id} notes={lead.notes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
