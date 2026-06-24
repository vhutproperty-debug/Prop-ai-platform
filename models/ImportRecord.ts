import { Schema, model, models } from "mongoose";
import {
  IMPORT_ENTITY_TYPES,
  IMPORT_RECORD_STATUSES,
  IMPORT_RECORD_TYPES,
} from "@/config/ingestion";

const DuplicateMatchSchema = new Schema(
  {
    type: { type: String, required: true },
    entityType: { type: String, enum: IMPORT_ENTITY_TYPES, required: true },
    existingId: { type: Schema.Types.ObjectId, required: true },
    existingSlug: { type: String },
    confidence: { type: Number, min: 0, max: 1 },
    message: { type: String },
  },
  { _id: false }
);

const ImportRecordSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "ImportJob",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: IMPORT_ENTITY_TYPES,
      default: "project",
      index: true,
    },
    status: {
      type: String,
      enum: IMPORT_RECORD_STATUSES,
      default: "staged",
      index: true,
    },
    recordType: {
      type: String,
      enum: IMPORT_RECORD_TYPES,
      default: "new",
      index: true,
    },
    slug: { type: String, required: true, index: true },
    displayName: { type: String, required: true, index: true },
    stagedData: { type: Schema.Types.Mixed, required: true },
    duplicates: [DuplicateMatchSchema],
    validationErrors: [{ type: String }],
    publishedId: { type: Schema.Types.ObjectId },
    existingProjectId: { type: Schema.Types.ObjectId, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

ImportRecordSchema.index({ jobId: 1, status: 1 });
ImportRecordSchema.index({ slug: 1, status: 1 });
ImportRecordSchema.index({ status: 1, createdAt: -1 });
ImportRecordSchema.index({ recordType: 1, status: 1, createdAt: -1 });

ImportRecordSchema.index({ "stagedData.project.reraNumber": 1 }, { sparse: true });

export const ImportRecord =
  models.ImportRecord || model("ImportRecord", ImportRecordSchema);
