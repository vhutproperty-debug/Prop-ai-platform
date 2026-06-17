import { Schema, model, models } from "mongoose";

const LocalitySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    city: { type: String, default: "Mumbai" },
    image: { type: String },
    investmentScore: { type: Number, min: 0, max: 100 },
    rentalScore: { type: Number, min: 0, max: 100 },
    growthScore: { type: Number, min: 0, max: 100 },
    walkability: { type: Number, min: 0, max: 100 },
    connectivity: { type: Number, min: 0, max: 100 },
    aiRecommendation: { type: String },
    avgPricePerSqft: { type: Number },
    description: { type: String },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

export const Locality =
  models.Locality || model("Locality", LocalitySchema);
