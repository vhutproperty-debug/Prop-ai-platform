import { Schema, model, models } from "mongoose";

const ImportLogSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "ImportJob",
      required: true,
      index: true,
    },
    recordId: { type: Schema.Types.ObjectId, ref: "ImportRecord", index: true },
    builderSlug: { type: String, trim: true, lowercase: true, index: true },
    projectSlug: { type: String, trim: true, lowercase: true, index: true },
    level: {
      type: String,
      enum: ["success", "warning", "error", "duplicate"],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
    url: { type: String },
  },
  { timestamps: true }
);

ImportLogSchema.index({ jobId: 1, level: 1, createdAt: -1 });
ImportLogSchema.index({ projectSlug: 1, createdAt: -1 });
ImportLogSchema.index({ createdAt: -1 });

export const ImportLog =
  models.ImportLog || model("ImportLog", ImportLogSchema);
