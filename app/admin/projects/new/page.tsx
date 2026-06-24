import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { ProjectForm } from "@/components/admin/project-form";
import { isDbConfigured } from "@/config/env";
import { adminBuilderService } from "@/services/admin/builders.service";
import { withDatabase } from "@/lib/db/with-database";
import { Location } from "@/models/Location";

export default async function NewProjectPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const [builders, locations] = await Promise.all([
    adminBuilderService.getOptions(),
    withDatabase(() =>
      Location.find({ isActive: true }).select("name slug").sort({ name: 1 }).lean()
    ),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="New Project" description="Create a new project listing." />
      <ProjectForm
        builders={builders.map((b) => ({ _id: String(b._id), name: String(b.name) }))}
        locations={locations.map((l) => ({ _id: String(l._id), name: String(l.name) }))}
      />
    </div>
  );
}
