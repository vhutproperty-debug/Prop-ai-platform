"use client";

import type { DatabaseDashboardData } from "@/services/database/admin-dashboard.service";
import type { DatabaseHealthReport } from "@/services/database/health.service";
import type { CrudTestResult } from "@/services/database/crud-verification.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "accent" : "outline"}>{ok ? "PASS" : "FAIL"}</Badge>
  );
}

export function DatabaseDashboard({
  dashboard,
  health,
  crudResults,
}: {
  dashboard: DatabaseDashboardData;
  health: DatabaseHealthReport;
  crudResults: CrudTestResult[];
}) {
  const connected = health.mongodb.connected;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={connected ? "accent" : "outline"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Database</CardTitle>
          </CardHeader>
          <CardContent className="font-medium">
            {health.mongodb.databaseName ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Response Time</CardTitle>
          </CardHeader>
          <CardContent className="font-medium">
            {health.mongodb.responseTimeMs}ms
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted">Total Documents</CardTitle>
          </CardHeader>
          <CardContent className="font-medium">
            {dashboard.totalDocuments.toLocaleString("en-IN")}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cluster & Environment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted">Host:</span>{" "}
            {health.mongodb.cluster?.host ?? dashboard.connection.host ?? "—"}
          </p>
          <p>
            <span className="text-muted">Atlas:</span>{" "}
            {health.mongodb.cluster?.isAtlas ? "Yes" : "No"}
          </p>
          <p>
            <span className="text-muted">Mongoose:</span>{" "}
            {health.mongodb.mongooseVersion}
          </p>
          <p>
            <span className="text-muted">Environment:</span> {dashboard.environment}
          </p>
          <p>
            <span className="text-muted">Last Connected:</span>{" "}
            {dashboard.connection.lastConnectedAt
              ? new Date(dashboard.connection.lastConnectedAt).toLocaleString("en-IN")
              : "—"}
          </p>
          <p>
            <span className="text-muted">Reconnect Attempts:</span>{" "}
            {dashboard.connection.reconnectAttempts}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CRUD Verification</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4">Entity</th>
                <th className="py-2 pr-4">Create</th>
                <th className="py-2 pr-4">Read</th>
                <th className="py-2 pr-4">Update</th>
                <th className="py-2 pr-4">Delete</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {crudResults.map((row) => (
                <tr key={row.entity} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium">{row.entity}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge ok={row.create} />
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge ok={row.read} />
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge ok={row.update} />
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge ok={row.delete} />
                  </td>
                  <td className="py-2 text-muted">{row.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
          {crudResults.some((r) => r.error) && (
            <div className="mt-4 space-y-1 text-xs text-red-700">
              {crudResults
                .filter((r) => r.error)
                .map((r) => (
                  <p key={r.entity}>
                    {r.entity}: {r.error}
                  </p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.collections.map((coll) => (
            <div
              key={coll.name}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
            >
              <span className="font-medium">{coll.name}</span>
              <span className="text-sm text-muted">
                {coll.documentCount.toLocaleString("en-IN")} docs · {coll.indexCount}{" "}
                indexes
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {dashboard.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboard.recentErrors.map((err, i) => (
              <div key={i}>
                <p className="text-muted">{new Date(err.at).toLocaleString("en-IN")}</p>
                <p>{err.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
