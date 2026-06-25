import { Schema, model, models } from "mongoose";
import { CONTENT_CAMPAIGN_TYPES } from "@/config/content-engine";

const ContentCampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: CONTENT_CAMPAIGN_TYPES,
      required: true,
      index: true,
    },
    description: { type: String, maxlength: 2000 },
    builderId: { type: Schema.Types.ObjectId, ref: "Builder", index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    scheduledAt: { type: Date, index: true },
    priority: { type: Number, default: 0, index: true },
    contentTypes: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ContentCampaignSchema.index({ type: 1, scheduledAt: 1 });

export const ContentCampaign =
  models.ContentCampaign || model("ContentCampaign", ContentCampaignSchema);
