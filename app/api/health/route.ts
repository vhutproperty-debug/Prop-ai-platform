import { NextResponse } from "next/server";
import { databaseHealthService } from "@/services/database/health.service";
import { isAuthConfigured, isCloudinaryConfigured, isDbConfigured } from "@/config/env";

export async function GET() {
  const health = await databaseHealthService.check();

  const statusCode =
    health.mongodb.status === "healthy"
      ? 200
      : health.mongodb.status === "not_configured"
        ? 503
        : 503;

  return NextResponse.json(
    {
      status: health.mongodb.status === "healthy" ? "ok" : "degraded",
      timestamp: health.timestamp,
      mongodb: health.mongodb,
      services: {
        database: isDbConfigured ? "configured" : "not_configured",
        auth: isAuthConfigured ? "configured" : "not_configured",
        cloudinary: isCloudinaryConfigured ? "configured" : "not_configured",
      },
    },
    { status: statusCode }
  );
}
