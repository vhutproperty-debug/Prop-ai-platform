import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ProjectForm } from "@/components/admin/project-form";
import { isDbConfigured } from "@/config/env";
import { NotFoundError } from "@/lib/errors";
import { withDatabase } from "@/lib/db/with-database";
import { Location } from "@/models/Location";
import { adminBuilderService } from "@/services/admin/builders.service";
import { adminProjectService } from "@/services/admin/projects.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const { id } = await params;

  let project;
  try {
    project = await adminProjectService.getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [builders, locations] = await Promise.all([
    adminBuilderService.getOptions(),
    withDatabase(() =>
      Location.find({ isActive: true }).select("name slug").sort({ name: 1 }).lean()
    ),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Edit ${project.projectName}`}
        description="Update project details."
      />
      <ProjectForm
        builders={builders.map((b) => ({ _id: String(b._id), name: String(b.name) }))}
        locations={locations.map((l) => ({ _id: String(l._id), name: String(l.name) }))}
        initial={{
          id,
          builderId: String(project.builderId),
          projectName: String(project.projectName),
          slug: String(project.slug),
          location: String(project.location),
          locationName: project.locationName ? String(project.locationName) : undefined,
          microMarket: project.microMarket ? String(project.microMarket) : undefined,
          status: String(project.status),
          tagline: project.tagline ? String(project.tagline) : undefined,
          description: project.description ? String(project.description) : undefined,
          reraNumber: project.reraNumber ? String(project.reraNumber) : undefined,
          brochure: project.brochure ? String(project.brochure) : undefined,
          featured: Boolean(project.featured),
          isActive: Boolean(project.isActive),
          seoTitle: project.seoTitle ? String(project.seoTitle) : undefined,
          seoDescription: project.seoDescription
            ? String(project.seoDescription)
            : undefined,
          priceRange: project.priceRange,
          possessionDate: project.possessionDate
            ? new Date(project.possessionDate).toISOString()
            : undefined,
        }}
      />
    </div>
  );
}
