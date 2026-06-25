import { Schema, model, models } from "mongoose";
import { CONTENT_TYPES, FACT_CONFIDENCE_LEVELS } from "@/config/content-engine";

const VerifiedFactSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    confidence: { type: String, enum: FACT_CONFIDENCE_LEVELS, required: true },
    source: { type: Schema.Types.Mixed },
    requiresReview: { type: Boolean, default: false },
  },
  { _id: false }
);

const ContentKnowledgePackSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    builderId: { type: Schema.Types.ObjectId, ref: "Builder", index: true },
    localityId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    contentType: { type: String, enum: CONTENT_TYPES, required: true, index: true },
    articleId: { type: Schema.Types.ObjectId, ref: "ContentArticle", index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "ContentJob", index: true },
    pack: { type: Schema.Types.Mixed, required: true },
    verifiedFacts: [VerifiedFactSchema],
    lowConfidenceCount: { type: Number, default: 0, index: true },
    dataCompleteness: { type: Number, min: 0, max: 100, index: true },
    externalDataAvailable: { type: Boolean, default: false },
    sources: [{ type: Schema.Types.Mixed }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ContentKnowledgePackSchema.index({ projectId: 1, contentType: 1, createdAt: -1 });
ContentKnowledgePackSchema.index({ builderId: 1, contentType: 1 });
ContentKnowledgePackSchema.index({ localityId: 1, contentType: 1 });

export const ContentKnowledgePack =
  models.ContentKnowledgePack ||
  model("ContentKnowledgePack", ContentKnowledgePackSchema);
