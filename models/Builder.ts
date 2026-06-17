import { Schema, model, models } from "mongoose";

const BuilderSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    logo: { type: String },
    tagline: { type: String },
    description: { type: String },
    projectCount: { type: Number, default: 0 },
    established: { type: Number },
    rating: { type: Number, min: 0, max: 5 },
    website: { type: String },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

export const Builder =
  models.Builder || model("Builder", BuilderSchema);
