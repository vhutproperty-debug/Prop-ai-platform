import { Schema, model, models } from "mongoose";
import {
  CONTENT_JOB_STATUSES,
  CONTENT_JOB_TYPES,
} from "@/config/content-engine";

const ContentJobSchema = new Schema(
  {
    type: {
      type: String,
      enum: CONTENT_JOB_TYPES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: CONTENT_JOB_STATUSES,
      default: "queued",
      index: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed },
    articleIds: [{ type: Schema.Types.ObjectId, ref: "ContentArticle" }],
    articlesCreated: { type: Number, default: 0 },
    articlesFailed: { type: Number, default: 0 },
    errors: [{ type: String }],
    warnings: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true }
);

ContentJobSchema.index({ status: 1, createdAt: -1 });
ContentJobSchema.index({ type: 1, status: 1 });

export const ContentJob =
  models.ContentJob || model("ContentJob", ContentJobSchema);
