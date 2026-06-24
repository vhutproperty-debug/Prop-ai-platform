import { Schema, model, models } from "mongoose";
import { FAQ_ENTITY_TYPES } from "@/config/model-constants";

const FAQSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: FAQ_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    question: { type: String, required: true, maxlength: 500 },
    answer: { type: String, required: true, maxlength: 5000 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

FAQSchema.index({ entityType: 1, entityId: 1, order: 1 });
FAQSchema.index({ question: "text", answer: "text" });

export const FAQ = models.FAQ || model("FAQ", FAQSchema);
