import Link from "next/link";
import { isDbConfigured } from "@/config/env";
import { LeadTable } from "@/components/admin/lead-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leadService } from "@/services/lead.service";

export default async function AdminLeadsPage() {
  if (!isDbConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted">
          <p>MongoDB is not configured. Set `MONGODB_URI` in your environment to enable CRM.</p>
          <Button asChild variant="outline">
            <Link href="/api/health">Check Health</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  let total = 0;
  let leads: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    createdAt: string;
  }> = [];

  try {
    const result = await leadService.list({ page: 1, limit: 100 });
    total = result.total;
    leads = result.items.map((lead) => ({
      _id: String(lead._id),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      createdAt: new Date(lead.createdAt).toISOString(),
    }));
  } catch {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
        </CardHeader>
        <CardContent className="text-muted">
          <p>Unable to connect to MongoDB. Check your connection string and try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Lead Management</h1>
          <p className="mt-1 text-sm text-muted">{total} total leads in pipeline</p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/leads/export">Export CSV</a>
        </Button>
      </div>
      <LeadTable leads={leads} />
    </div>
  );
}
