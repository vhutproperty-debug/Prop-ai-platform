import { Schema, model, models } from "mongoose";

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    source: {
      type: String,
      enum: ["website", "ai-search", "project-page", "referral", "partner"],
      default: "website",
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    locality: { type: Schema.Types.ObjectId, ref: "Locality" },
    query: { type: String },
    budget: { min: Number, max: Number },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "converted", "lost"],
      default: "new",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: [{ type: String }],
  },
  { timestamps: true }
);

export const Lead = models.Lead || model("Lead", LeadSchema);
