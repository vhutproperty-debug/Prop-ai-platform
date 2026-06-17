import { NextResponse } from "next/server";
import { localities } from "@/data/homepage";
import { connectDB } from "@/lib/db/mongodb";
import { Locality } from "@/models/Locality";

export async function GET() {
  try {
    await connectDB();
    const dbLocalities = await Locality.find().sort({ name: 1 }).lean();

    if (dbLocalities.length > 0) {
      return NextResponse.json({ success: true, data: dbLocalities });
    }
  } catch {
    // Fall back to static data when DB is unavailable
  }

  return NextResponse.json({ success: true, data: localities, source: "static" });
}
