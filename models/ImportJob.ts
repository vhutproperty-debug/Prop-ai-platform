import { Schema, model, models } from "mongoose";
import {
  IMPORT_JOB_STATUSES,
  IMPORT_SOURCES,
} from "@/config/ingestion";

const IngestionLogSchema = new Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ImportJobSchema = new Schema(
  {
    source: { type: String, enum: IMPORT_SOURCES, required: true, index: true },
    status: {
      type: String,
      enum: IMPORT_JOB_STATUSES,
      default: "queued",
      index: true,
    },
    fileName: { type: String },
    sourceReference: { type: String },
    recordCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    publishedCount: { type: Number, default: 0 },
    logs: [IngestionLogSchema],
    errorMessage: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ImportJobSchema.index({ status: 1, createdAt: -1 });
ImportJobSchema.index({ source: 1, createdAt: -1 });
ImportJobSchema.index({ createdBy: 1, createdAt: -1 });

export const ImportJob =
  models.ImportJob || model("ImportJob", ImportJobSchema);
