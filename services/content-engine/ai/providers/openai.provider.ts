import { env, isAiConfigured } from "@/config/env";
import type {
  AiProvider,
  LlmCompletionOptions,
  LlmMessage,
} from "@/services/content-engine/ai/providers/types";

const DEFAULT_MODEL = "gpt-4o-mini";

export const openAiProvider: AiProvider = {
  id: "openai",

  isAvailable() {
    return isAiConfigured;
  },

  async complete(messages: LlmMessage[], options: LlmCompletionOptions = {}) {
    if (!isAiConfigured) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        response_format: options.jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return content;
  },

  async completeJson<T>(messages: LlmMessage[], options?: LlmCompletionOptions) {
    const raw = await this.complete(messages, { ...options, jsonMode: true });
    return JSON.parse(raw) as T;
  },
};
