import { Schema, model, models } from "mongoose";
import {
  POI_CONFIDENCE_LEVELS,
  POI_ENTITY_TYPES,
  POI_SOURCES,
  POI_TYPES,
} from "@/config/location-intelligence";

const NearbyPlaceSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: POI_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
    type: {
      type: String,
      enum: POI_TYPES,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    distanceMeters: { type: Number, min: 0 },
    distanceLabel: { type: String, trim: true, maxlength: 80 },
    travelTimeMinutes: { type: Number, min: 0 },
    travelTimeLabel: { type: String, trim: true, maxlength: 80 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    source: {
      type: String,
      enum: POI_SOURCES,
      default: "manual",
      index: true,
    },
    confidence: {
      type: String,
      enum: POI_CONFIDENCE_LEVELS,
      default: "medium",
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

NearbyPlaceSchema.index(
  { entityType: 1, entityId: 1, slug: 1 },
  { unique: true }
);
NearbyPlaceSchema.index({ projectId: 1, type: 1, isActive: 1 });
NearbyPlaceSchema.index({ locationId: 1, type: 1, isActive: 1 });
NearbyPlaceSchema.index({ name: "text" });

export const NearbyPlace =
  models.NearbyPlace || model("NearbyPlace", NearbyPlaceSchema);
