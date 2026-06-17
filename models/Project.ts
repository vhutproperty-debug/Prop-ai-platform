import { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    builder: { type: Schema.Types.ObjectId, ref: "Builder" },
    builderName: { type: String, required: true },
    locality: { type: Schema.Types.ObjectId, ref: "Locality" },
    localityName: { type: String, required: true },
    configuration: { type: String, required: true },
    priceFrom: { type: Number, required: true },
    priceTo: { type: Number, required: true },
    images: [{ type: String }],
    tagline: { type: String },
    description: { type: String },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "ready"],
      default: "ongoing",
    },
    featured: { type: Boolean, default: false },
    amenities: [{ type: String }],
    rera: { type: String },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

export const Project =
  models.Project || model("Project", ProjectSchema);
