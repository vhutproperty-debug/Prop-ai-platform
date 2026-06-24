import { Schema, model, models } from "mongoose";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/config/constants";

const PriceRangeSchema = new Schema(
  {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: "website",
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    builderId: { type: Schema.Types.ObjectId, ref: "Builder", index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    query: { type: String, maxlength: 1000 },
    budget: PriceRangeSchema,
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "NEW",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    notes: [{ type: String }],
    aiAnswers: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ email: 1, phone: 1 });
LeadSchema.index({ projectId: 1, status: 1 });
LeadSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
LeadSchema.index({ name: "text", email: "text", phone: "text", query: "text" });

export const Lead = models.Lead || model("Lead", LeadSchema);
