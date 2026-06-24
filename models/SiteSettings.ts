import { Schema, model, models } from "mongoose";

const SocialLinksSchema = new Schema(
  {
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    facebook: { type: String },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true },
    siteName: { type: String, default: "Prop AI", maxlength: 120 },
    siteUrl: { type: String, default: "http://localhost:3000" },
    defaultSeoTitle: {
      type: String,
      maxlength: 160,
      default: "Prop AI — Mumbai Real Estate",
    },
    defaultSeoDescription: {
      type: String,
      maxlength: 320,
      default:
        "Discover Mumbai real estate with AI-powered search and market intelligence.",
    },
    brandAccentColor: { type: String, default: "#c9a962", maxlength: 20 },
    brandLogoUrl: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SiteSettings =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);
