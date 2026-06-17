import { NextResponse } from "next/server";
import { builders } from "@/data/homepage";
import { connectDB } from "@/lib/db/mongodb";
import { Builder } from "@/models/Builder";

export async function GET() {
  try {
    await connectDB();
    const dbBuilders = await Builder.find().sort({ rating: -1 }).lean();

    if (dbBuilders.length > 0) {
      return NextResponse.json({ success: true, data: dbBuilders });
    }
  } catch {
    // Fall back to static data when DB is unavailable
  }

  return NextResponse.json({ success: true, data: builders, source: "static" });
}
