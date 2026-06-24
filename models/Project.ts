import { Schema, model, models } from "mongoose";
import { PROJECT_STATUSES } from "@/config/constants";

const PriceRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0, index: true },
    max: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    builderId: {
      type: Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
      index: true,
    },
    builderName: { type: String, required: true, trim: true, index: true },
    projectName: { type: String, required: true, trim: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
      index: true,
    },
    locationName: { type: String, trim: true, index: true },
    microMarket: { type: String, trim: true, index: true },
    configurations: [{ type: Schema.Types.ObjectId, ref: "Configuration" }],
    priceRange: { type: PriceRangeSchema, required: true },
    amenities: [{ type: Schema.Types.ObjectId, ref: "Amenity" }],
    gallery: [{ type: Schema.Types.ObjectId, ref: "Image" }],
    reraNumber: { type: String, trim: true, index: true },
    possessionDate: { type: Date, index: true },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "ongoing",
      index: true,
    },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    description: { type: String, maxlength: 10000 },
    tagline: { type: String, maxlength: 300 },
    brochure: { type: String },
    featured: { type: Boolean, default: false, index: true },
    seoTitle: { type: String, maxlength: 160 },
    seoDescription: { type: String, maxlength: 320 },
    faqs: [{ type: Schema.Types.ObjectId, ref: "FAQ" }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProjectSchema.index({
  projectName: "text",
  builderName: "text",
  locationName: "text",
  microMarket: "text",
  description: "text",
  tagline: "text",
});

ProjectSchema.index({ featured: -1, status: 1, isActive: 1 });
ProjectSchema.index({ builderId: 1, status: 1, isActive: 1 });
ProjectSchema.index({ location: 1, microMarket: 1, isActive: 1 });
ProjectSchema.index({ "priceRange.min": 1, "priceRange.max": 1 });
ProjectSchema.index({ latitude: 1, longitude: 1 });
ProjectSchema.index({ possessionDate: 1, status: 1 });

export const Project =
  models.Project || model("Project", ProjectSchema);
