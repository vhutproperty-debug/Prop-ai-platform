import { withDatabase } from "@/lib/db/with-database";
import { SiteSettings } from "@/models/SiteSettings";
import type { SiteSettingsInput } from "@/validations/admin";

const SETTINGS_KEY = "default";

export const adminSettingsService = {
  async get() {
    return withDatabase(async () => {
      let settings = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();
      if (!settings) {
        settings = (
          await SiteSettings.create({ key: SETTINGS_KEY })
        ).toObject();
      }
      return settings;
    });
  },

  async update(input: SiteSettingsInput) {
    return withDatabase(async () => {
      const settings = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        {
          $set: {
            ...input,
            brandLogoUrl: input.brandLogoUrl || undefined,
            contactEmail: input.contactEmail || undefined,
            contactPhone: input.contactPhone || undefined,
            socialLinks: {
              twitter: input.socialLinks?.twitter || undefined,
              instagram: input.socialLinks?.instagram || undefined,
              linkedin: input.socialLinks?.linkedin || undefined,
              facebook: input.socialLinks?.facebook || undefined,
            },
          },
        },
        { new: true, upsert: true, runValidators: true }
      ).lean();

      return settings;
    });
  },
};
