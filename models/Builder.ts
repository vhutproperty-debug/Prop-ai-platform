import { Schema, model, models } from "mongoose";

const BuilderSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    logo: { type: Schema.Types.ObjectId, ref: "Image" },
    logoUrl: { type: String },
    tagline: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 5000 },
    website: { type: String },
    establishedYear: { type: Number, min: 1800 },
    projectCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, min: 0, max: 5, index: true },
    headquarters: { type: String },
    seoTitle: { type: String, maxlength: 160 },
    seoDescription: { type: String, maxlength: 320 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

BuilderSchema.index({ name: "text", tagline: "text", description: "text" });
BuilderSchema.index({ isActive: 1, isFeatured: -1, rating: -1 });

export const Builder =
  models.Builder || model("Builder", BuilderSchema);
