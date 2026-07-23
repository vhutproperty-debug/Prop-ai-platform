import { Schema, model, models } from "mongoose";
import { PROJECT_INTELLIGENCE_SCHEMA_VERSION } from "@/types/project-intelligence";

const ProjectIntelligenceSchema = new Schema(
  {
    sourceUrl: { type: String, required: true, index: true },
    canonicalUrl: { type: String, required: true, index: true },
    schemaVersion: {
      type: Number,
      default: PROJECT_INTELLIGENCE_SCHEMA_VERSION,
      index: true,
    },
    report: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true, collection: "project_intelligence" }
);

ProjectIntelligenceSchema.index({ canonicalUrl: 1, createdAt: -1 });
ProjectIntelligenceSchema.index({ createdAt: -1 });

export const ProjectIntelligence =
  models.ProjectIntelligence ||
  model("ProjectIntelligence", ProjectIntelligenceSchema);
