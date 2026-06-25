import Link from "next/link";
import { Suspense } from "react";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ContentGenerateForm } from "@/components/admin/content/content-generate-form";
import { isDbConfigured } from "@/config/env";
import { adminProjectService } from "@/services/admin/projects.service";
import { projectFilterSchema } from "@/validations/admin";

export const dynamic = "force-dynamic";

export default async function ContentGeneratePage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const projectsResult = await adminProjectService.list(
    projectFilterSchema.parse({ page: "1", limit: "200", isActive: "true" })
  );

  const projects = projectsResult.items.map((p) => ({
    _id: String(p._id),
    name: String(p.projectName),
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm text-muted hover:text-foreground">
        ← Content Engine
      </Link>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Generate Content</h1>
        <p className="mt-1 text-sm text-muted">
          Select project, content types, and quantity to auto-generate SEO articles.
        </p>
      </div>
      <Suspense>
        <ContentGenerateForm projects={projects} />
      </Suspense>
    </div>
  );
}
