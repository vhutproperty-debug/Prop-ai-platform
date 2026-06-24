import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BuilderForm } from "@/components/admin/builder-form";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { isDbConfigured } from "@/config/env";

export default function NewBuilderPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="New Builder" description="Create a new builder profile." />
      <BuilderForm />
    </div>
  );
}
