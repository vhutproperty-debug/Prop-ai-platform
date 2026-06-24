import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DbNotConfigured } from "@/components/admin/db-not-configured";
import { SettingsForm } from "@/components/admin/settings-form";
import { isDbConfigured } from "@/config/env";
import { adminSettingsService } from "@/services/admin/settings.service";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!isDbConfigured) return <DbNotConfigured />;

  const settings = await adminSettingsService.get();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Site configuration, SEO defaults, and brand settings."
      />
      <SettingsForm
        initial={{
          siteName: String(settings.siteName ?? "Prop AI"),
          siteUrl: String(settings.siteUrl ?? "http://localhost:3000"),
          defaultSeoTitle: String(settings.defaultSeoTitle ?? ""),
          defaultSeoDescription: String(settings.defaultSeoDescription ?? ""),
          brandAccentColor: String(settings.brandAccentColor ?? "#c9a962"),
          brandLogoUrl: settings.brandLogoUrl ? String(settings.brandLogoUrl) : undefined,
          contactEmail: settings.contactEmail ? String(settings.contactEmail) : undefined,
          contactPhone: settings.contactPhone ? String(settings.contactPhone) : undefined,
          maintenanceMode: Boolean(settings.maintenanceMode),
          socialLinks: settings.socialLinks as SettingsFormSocialLinks,
        }}
      />
    </div>
  );
}

type SettingsFormSocialLinks = {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
};
