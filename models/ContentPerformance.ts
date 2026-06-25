import { Schema, model, models } from "mongoose";

const ContentPerformanceSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "ContentArticle",
      required: true,
      unique: true,
      index: true,
    },
    articleSlug: { type: String, required: true, index: true },
    organicTraffic: { type: Number, default: 0, index: true },
    ctr: { type: Number, default: 0, min: 0, max: 100 },
    leadsGenerated: { type: Number, default: 0, index: true },
    conversions: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0, min: 0, max: 100 },
    averageRanking: { type: Number, default: 0 },
    timeOnPage: { type: Number, default: 0 },
    contentDecayScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    needsRefresh: { type: Boolean, default: false, index: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    lastSyncedAt: { type: Date, index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ContentPerformanceSchema.index({ contentDecayScore: -1, organicTraffic: -1 });
ContentPerformanceSchema.index({ leadsGenerated: -1, conversions: -1 });

export const ContentPerformance =
  models.ContentPerformance ||
  model("ContentPerformance", ContentPerformanceSchema);
