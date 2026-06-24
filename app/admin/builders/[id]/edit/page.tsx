import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BuilderForm } from "@/components/admin/builder-form";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";
import { NotFoundError } from "@/lib/errors";
import { adminBuilderService } from "@/services/admin/builders.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBuilderPage({ params }: PageProps) {
  if (!isDbConfigured) return <DbNotConfigured />;

  const { id } = await params;

  let builder;
  try {
    builder = await adminBuilderService.getById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Edit ${builder.name}`} description="Update builder details." />
      <BuilderForm
        initial={{
          id,
          name: String(builder.name),
          slug: String(builder.slug),
          logoUrl: builder.logoUrl ? String(builder.logoUrl) : undefined,
          tagline: builder.tagline ? String(builder.tagline) : undefined,
          description: builder.description ? String(builder.description) : undefined,
          website: builder.website ? String(builder.website) : undefined,
          establishedYear: builder.establishedYear,
          rating: builder.rating,
          headquarters: builder.headquarters ? String(builder.headquarters) : undefined,
          isActive: Boolean(builder.isActive),
          isFeatured: Boolean(builder.isFeatured),
        }}
      />
    </div>
  );
}
