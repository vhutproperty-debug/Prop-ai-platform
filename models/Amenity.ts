import { Schema, model, models } from "mongoose";
import { AMENITY_CATEGORIES } from "@/config/model-constants";

const AmenitySchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: AMENITY_CATEGORIES,
      required: true,
      index: true,
    },
    icon: { type: String },
    description: { type: String, maxlength: 500 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AmenitySchema.index({ name: "text", description: "text" });
AmenitySchema.index({ category: 1, isActive: 1 });

export const Amenity =
  models.Amenity || model("Amenity", AmenitySchema);
