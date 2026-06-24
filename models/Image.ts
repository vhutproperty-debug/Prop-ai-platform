import { Schema, model, models } from "mongoose";
import { IMAGE_ENTITY_TYPES, IMAGE_TYPES } from "@/config/model-constants";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, index: true },
    alt: { type: String, maxlength: 200 },
    caption: { type: String, maxlength: 300 },
    entityType: {
      type: String,
      enum: IMAGE_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: IMAGE_TYPES,
      default: "gallery",
      index: true,
    },
    order: { type: Number, default: 0, index: true },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ImageSchema.index({ entityType: 1, entityId: 1, type: 1, order: 1 });
ImageSchema.index({ publicId: 1 }, { unique: true, sparse: true });

export const Image = models.Image || model("Image", ImageSchema);
