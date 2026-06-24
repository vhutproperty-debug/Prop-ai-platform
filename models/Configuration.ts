import { Schema, model, models } from "mongoose";
import { CONFIGURATION_TYPES } from "@/config/model-constants";

const AreaRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ["sqft", "sqm"], default: "sqft" },
  },
  { _id: false }
);

const PriceRangeSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const ConfigurationSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    slug: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: CONFIGURATION_TYPES, required: true, index: true },
    bhk: { type: Number, min: 0, max: 10, index: true },
    carpetArea: AreaRangeSchema,
    builtUpArea: AreaRangeSchema,
    priceRange: { type: PriceRangeSchema, required: true },
    availableUnits: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ConfigurationSchema.index({ projectId: 1, slug: 1 }, { unique: true });
ConfigurationSchema.index({ "priceRange.min": 1, "priceRange.max": 1 });
ConfigurationSchema.index({ type: 1, bhk: 1, isActive: 1 });

export const Configuration =
  models.Configuration || model("Configuration", ConfigurationSchema);
