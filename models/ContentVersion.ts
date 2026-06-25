import { Schema, model, models } from "mongoose";

const ContentVersionSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "ContentArticle",
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changeReason: { type: String },
  },
  { timestamps: true }
);

ContentVersionSchema.index({ articleId: 1, version: -1 }, { unique: true });

export const ContentVersion =
  models.ContentVersion || model("ContentVersion", ContentVersionSchema);
