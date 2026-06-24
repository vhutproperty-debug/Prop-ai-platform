import { Schema, model, models } from "mongoose";
import { EMBEDDING_ENTITY_TYPES } from "@/config/constants";

const EmbeddingSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: EMBEDDING_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

EmbeddingSchema.index({ entityType: 1, entityId: 1 }, { unique: true });

export const Embedding =
  models.Embedding || model("Embedding", EmbeddingSchema);
