import type {
  AiProvider,
  LlmMessage,
} from "@/services/content-engine/ai/providers/types";

/**
 * Deterministic template provider — always available when structured data exists.
 * Used when no LLM is configured or as explicit fallback.
 */
export const templateAiProvider: AiProvider = {
  id: "template",

  isAvailable() {
    return true;
  },

  async complete(messages: LlmMessage[]) {
    const user = messages.find((m) => m.role === "user")?.content ?? "";
    return JSON.stringify({
      mode: "template",
      note: "Template provider does not generate prose directly. Use knowledge-pack generation.",
      inputLength: user.length,
    });
  },

  async completeJson<T>(messages: LlmMessage[]) {
    const raw = await this.complete(messages);
    return JSON.parse(raw) as T;
  },
};
