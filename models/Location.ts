import { Schema, model, models } from "mongoose";
import { LOCATION_TYPES } from "@/config/model-constants";

const LocationSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, default: "Mumbai", index: true },
    state: { type: String, required: true, default: "Maharashtra" },
    country: { type: String, required: true, default: "India" },
    type: {
      type: String,
      enum: LOCATION_TYPES,
      default: "locality",
      index: true,
    },
    microMarket: { type: String, trim: true, index: true },
    parentLocation: { type: Schema.Types.ObjectId, ref: "Location" },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    avgPricePerSqft: { type: Number, min: 0, index: true },
    investmentScore: { type: Number, min: 0, max: 100 },
    rentalScore: { type: Number, min: 0, max: 100 },
    growthScore: { type: Number, min: 0, max: 100 },
    walkability: { type: Number, min: 0, max: 100 },
    connectivity: { type: Number, min: 0, max: 100 },
    aiRecommendation: { type: String, maxlength: 1000 },
    description: { type: String, maxlength: 5000 },
    coverImage: { type: Schema.Types.ObjectId, ref: "Image" },
    seoTitle: { type: String, maxlength: 160 },
    seoDescription: { type: String, maxlength: 320 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

LocationSchema.index({ name: "text", microMarket: "text", description: "text" });
LocationSchema.index({ city: 1, microMarket: 1, isActive: 1 });
LocationSchema.index({ investmentScore: -1, rentalScore: -1 });
LocationSchema.index({ latitude: 1, longitude: 1 });

export const Location =
  models.Location || model("Location", LocationSchema);
