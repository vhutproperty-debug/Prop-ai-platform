import { Schema, model, models } from "mongoose";
import { CONTENT_AUDIT_ACTIONS } from "@/config/content-engine";

const ContentAuditLogSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "ContentArticle",
      index: true,
    },
    jobId: { type: Schema.Types.ObjectId, ref: "ContentJob", index: true },
    action: {
      type: String,
      enum: CONTENT_AUDIT_ACTIONS,
      required: true,
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ContentAuditLogSchema.index({ articleId: 1, createdAt: -1 });
ContentAuditLogSchema.index({ action: 1, createdAt: -1 });

export const ContentAuditLog =
  models.ContentAuditLog || model("ContentAuditLog", ContentAuditLogSchema);
