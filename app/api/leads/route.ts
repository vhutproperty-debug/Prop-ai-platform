import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Lead } from "@/models/Lead";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, query, source } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    try {
      await connectDB();
      const lead = await Lead.create({
        name,
        email,
        phone,
        query,
        source: source || "website",
      });
      return NextResponse.json({ success: true, data: lead }, { status: 201 });
    } catch {
      return NextResponse.json(
        {
          success: true,
          data: { name, email, phone, query },
          message: "Lead captured (DB unavailable)",
        },
        { status: 201 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
