"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSettingsAction } from "@/actions/admin/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsFormProps {
  initial: {
    siteName: string;
    siteUrl: string;
    defaultSeoTitle: string;
    defaultSeoDescription: string;
    brandAccentColor: string;
    brandLogoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      linkedin?: string;
      facebook?: string;
    };
    maintenanceMode?: boolean;
  };
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(event.currentTarget);

    const payload = {
      siteName: String(formData.get("siteName")),
      siteUrl: String(formData.get("siteUrl")),
      defaultSeoTitle: String(formData.get("defaultSeoTitle")),
      defaultSeoDescription: String(formData.get("defaultSeoDescription")),
      brandAccentColor: String(formData.get("brandAccentColor")),
      brandLogoUrl: String(formData.get("brandLogoUrl") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      contactPhone: String(formData.get("contactPhone") || ""),
      maintenanceMode: formData.get("maintenanceMode") === "on",
      socialLinks: {
        twitter: String(formData.get("twitter") || ""),
        instagram: String(formData.get("instagram") || ""),
        linkedin: String(formData.get("linkedin") || ""),
        facebook: String(formData.get("facebook") || ""),
      },
    };

    startTransition(async () => {
      const result = await updateSettingsAction(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-3xl border border-border bg-white p-8">
        <h2 className="text-lg font-semibold">Site Configuration</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input id="siteName" name="siteName" required defaultValue={initial.siteName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input id="siteUrl" name="siteUrl" type="url" required defaultValue={initial.siteUrl} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input id="contactPhone" name="contactPhone" defaultValue={initial.contactPhone} />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" name="maintenanceMode" defaultChecked={initial.maintenanceMode} />
          Maintenance mode
        </label>
      </section>

      <section className="rounded-3xl border border-border bg-white p-8">
        <h2 className="text-lg font-semibold">SEO Defaults</h2>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultSeoTitle">Default SEO Title</Label>
            <Input id="defaultSeoTitle" name="defaultSeoTitle" required defaultValue={initial.defaultSeoTitle} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultSeoDescription">Default SEO Description</Label>
            <Textarea id="defaultSeoDescription" name="defaultSeoDescription" rows={3} required defaultValue={initial.defaultSeoDescription} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-white p-8">
        <h2 className="text-lg font-semibold">Brand Settings</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brandAccentColor">Accent Color</Label>
            <Input id="brandAccentColor" name="brandAccentColor" required defaultValue={initial.brandAccentColor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandLogoUrl">Brand Logo URL</Label>
            <Input id="brandLogoUrl" name="brandLogoUrl" type="url" defaultValue={initial.brandLogoUrl} />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input id="twitter" name="twitter" type="url" defaultValue={initial.socialLinks?.twitter} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" type="url" defaultValue={initial.socialLinks?.instagram} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" type="url" defaultValue={initial.socialLinks?.linkedin} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" name="facebook" type="url" defaultValue={initial.socialLinks?.facebook} />
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Settings saved successfully.</p> : null}

      <Button type="submit" variant="accent" disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
