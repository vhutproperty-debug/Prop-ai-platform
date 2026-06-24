import { Schema, model, models } from "mongoose";
import {
  LEAD_SCORES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/config/constants";

const PriceRangeSchema = new Schema(
  {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const LeadNoteSchema = new Schema(
  {
    content: { type: String, required: true, maxlength: 5000 },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, maxlength: 120 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const LeadActivitySchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "created",
        "updated",
        "status_change",
        "score_change",
        "note_added",
        "assigned",
        "integration",
      ],
      required: true,
      index: true,
    },
    message: { type: String, required: true, maxlength: 1000 },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, maxlength: 120 },
    meta: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { _id: true }
);

const LeadIntegrationsSchema = new Schema(
  {
    hubspot: {
      contactId: String,
      dealId: String,
      syncedAt: Date,
    },
    whatsapp: {
      conversationId: String,
      lastMessageAt: Date,
    },
    meta: {
      eventId: String,
      pixelId: String,
      sentAt: Date,
    },
  },
  { _id: false }
);

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, trim: true, index: true },
    budget: PriceRangeSchema,
    configuration: { type: String, trim: true, maxlength: 120, index: true },
    timeline: { type: String, trim: true, maxlength: 120 },
    purpose: { type: String, trim: true, maxlength: 200, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    projectSlug: { type: String, trim: true, lowercase: true, index: true },
    builderId: { type: Schema.Types.ObjectId, ref: "Builder", index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    source: {
      type: String,
      enum: LEAD_SOURCES,
      default: "homepage",
      index: true,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
      index: true,
    },
    score: {
      type: String,
      enum: LEAD_SCORES,
      default: "warm",
      index: true,
    },
    notes: [LeadNoteSchema],
    activities: [LeadActivitySchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    assignedToName: { type: String, trim: true },
    query: { type: String, maxlength: 1000 },
    integrations: LeadIntegrationsSchema,
    aiAnswers: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1, score: 1, createdAt: -1 });
LeadSchema.index({ source: 1, status: 1, createdAt: -1 });
LeadSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
LeadSchema.index({ projectId: 1, status: 1, createdAt: -1 });
LeadSchema.index({ projectSlug: 1, createdAt: -1 });
LeadSchema.index({ score: 1, status: 1, createdAt: -1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({
  name: "text",
  email: "text",
  phone: "text",
  configuration: "text",
  purpose: "text",
  query: "text",
  projectSlug: "text",
});

export const Lead = models.Lead || model("Lead", LeadSchema);
