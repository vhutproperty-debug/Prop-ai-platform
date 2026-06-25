import { Schema, model, models } from "mongoose";
import {
  CONTENT_AUTHOR_TYPES,
  CONTENT_SOURCE_TYPES,
  CONTENT_STATUSES,
  CONTENT_TYPES,
} from "@/config/content-engine";

const ContentSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    heading: { type: String, required: true },
    body: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContentFaqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContentTocSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    level: { type: Number, default: 2 },
  },
  { _id: false }
);

const InternalLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["project", "builder", "locality", "article"],
      required: true,
    },
    entitySlug: { type: String, required: true },
  },
  { _id: false }
);

const ExternalRefSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const ImageSuggestionSchema = new Schema(
  {
    type: { type: String, enum: ["featured", "gallery", "section"], default: "featured" },
    url: { type: String },
    prompt: { type: String, required: true },
    altText: { type: String, required: true },
    caption: { type: String },
  },
  { _id: false }
);

const ContentArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: CONTENT_TYPES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: "draft",
      index: true,
    },
    sourceType: {
      type: String,
      enum: CONTENT_SOURCE_TYPES,
      required: true,
      index: true,
    },
    sourceId: { type: Schema.Types.ObjectId, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    builderId: { type: Schema.Types.ObjectId, ref: "Builder", index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    projectSlug: { type: String, trim: true, lowercase: true, index: true },
    builderSlug: { type: String, trim: true, lowercase: true, index: true },
    localitySlug: { type: String, trim: true, lowercase: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    authorType: {
      type: String,
      enum: CONTENT_AUTHOR_TYPES,
      default: "ai",
      index: true,
    },
    isAiGenerated: { type: Boolean, default: true, index: true },
    isHumanEdited: { type: Boolean, default: false, index: true },
    featuredSummary: { type: String, maxlength: 500 },
    introduction: { type: String, maxlength: 20000 },
    sections: [ContentSectionSchema],
    tableOfContents: [ContentTocSchema],
    faqs: [ContentFaqSchema],
    callToAction: { type: String, maxlength: 2000 },
    seoTitle: { type: String, maxlength: 160, index: true },
    seoDescription: { type: String, maxlength: 320 },
    canonicalUrl: { type: String },
    ogTitle: { type: String, maxlength: 160 },
    ogDescription: { type: String, maxlength: 320 },
    ogImage: { type: String },
    twitterTitle: { type: String, maxlength: 160 },
    twitterDescription: { type: String, maxlength: 320 },
    twitterImage: { type: String },
    schemaData: { type: Schema.Types.Mixed },
    internalLinks: [InternalLinkSchema],
    externalReferences: [ExternalRefSchema],
    relatedProjects: [{ type: String }],
    relatedBuilders: [{ type: String }],
    relatedLocalities: [{ type: String }],
    relatedArticles: [{ type: String }],
    imageSuggestions: [ImageSuggestionSchema],
    imagePrompts: [{ type: String }],
    featuredImageSuggestion: { type: String },
    gallerySuggestions: [{ type: String }],
    socialCaption: { type: String, maxlength: 2000 },
    newsletterSummary: { type: String, maxlength: 1000 },
    keywords: [{ type: String, index: true }],
    keywordDensity: { type: Schema.Types.Mixed },
    readabilityScore: { type: Number, min: 0, max: 100, index: true },
    seoScore: { type: Number, min: 0, max: 100, index: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "ContentCampaign", index: true },
    scheduledAt: { type: Date, index: true },
    publishedAt: { type: Date, index: true },
    priority: { type: Number, default: 0, index: true },
    version: { type: Number, default: 1 },
    needsRefresh: { type: Boolean, default: false, index: true },
    refreshReason: { type: String },
    knowledgePackId: { type: Schema.Types.ObjectId, ref: "ContentKnowledgePack", index: true },
    lowConfidenceFacts: [{ type: Schema.Types.Mixed }],
    researchCompleteness: { type: Number, min: 0, max: 100 },
    duplicateWarnings: [{ type: Schema.Types.Mixed }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ContentArticleSchema.index({ status: 1, scheduledAt: 1 });
ContentArticleSchema.index({ contentType: 1, status: 1, publishedAt: -1 });
ContentArticleSchema.index({ projectSlug: 1, contentType: 1 });
ContentArticleSchema.index({ builderSlug: 1, contentType: 1 });
ContentArticleSchema.index({ localitySlug: 1, contentType: 1 });
ContentArticleSchema.index({
  title: "text",
  introduction: "text",
  featuredSummary: "text",
  keywords: "text",
});

export const ContentArticle =
  models.ContentArticle || model("ContentArticle", ContentArticleSchema);
