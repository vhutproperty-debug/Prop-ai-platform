import { NextResponse } from "next/server";
import { featuredProjects } from "@/data/homepage";
import { connectDB } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";

  try {
    await connectDB();
    const dbProjects = await Project.find(featured ? { featured: true } : {})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (dbProjects.length > 0) {
      return NextResponse.json({ success: true, data: dbProjects });
    }
  } catch {
    // Fall back to static data when DB is unavailable
  }

  const data = featured
    ? featuredProjects.filter((p) => p.featured)
    : featuredProjects;

  return NextResponse.json({ success: true, data, source: "static" });
}
