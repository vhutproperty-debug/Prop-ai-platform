import { NextResponse } from "next/server";
import { isAuthConfigured, isCloudinaryConfigured, isDbConfigured } from "@/config/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: isDbConfigured ? "configured" : "not_configured",
      auth: isAuthConfigured ? "configured" : "not_configured",
      cloudinary: isCloudinaryConfigured ? "configured" : "not_configured",
    },
  });
}
