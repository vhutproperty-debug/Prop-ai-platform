import { isAiConfigured } from "@/config/env";
import type { EmbeddingEntityType } from "@/config/constants";
import { withDatabase } from "@/lib/db/with-database";
import { Embedding } from "@/models/Embedding";

export const embeddingService = {
  async generateVector(content: string): Promise<number[]> {
    if (!isAiConfigured) {
      return content
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 128)
        .map((_, i) => (content.charCodeAt(i % content.length) % 100) / 100);
    }

    // Placeholder for OpenAI / Voyage / Cohere embeddings integration
    console.info("[Embeddings] AI provider configured — wire embedding API in Phase 2");
    return [];
  },

  async upsert(
    entityType: EmbeddingEntityType,
    entityId: string,
    content: string,
    metadata?: Record<string, unknown>
  ) {
    const embedding = await this.generateVector(content);

    return withDatabase(() =>
      Embedding.findOneAndUpdate(
        { entityType, entityId },
        { content, embedding, metadata },
        { upsert: true, new: true }
      ).lean()
    );
  },

  async searchSimilar(query: string, limit = 5) {
    const queryVector = await this.generateVector(query);

    const records = await withDatabase(() =>
      Embedding.find({ embedding: { $exists: true, $ne: [] } }).lean()
    );

    if (!records.length || !queryVector.length) {
      return [];
    }

    return records
      .map((record) => ({
        ...record,
        score: cosineSimilarity(queryVector, record.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
