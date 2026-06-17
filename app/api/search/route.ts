import { NextResponse } from "next/server";
import { searchSuggestions } from "@/data/homepage";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    const results = searchSuggestions.filter((s) =>
      s.text.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
        aiResponse: `Based on your search for "${query}", I found ${results.length} relevant suggestions. Full AI search will be available in Phase 2.`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
