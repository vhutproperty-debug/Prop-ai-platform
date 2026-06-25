import type {
  LlmCompletionOptions,
  LlmMessage,
} from "@/services/content-engine/ai/providers/types";
import { aiProviderRegistry } from "@/services/content-engine/ai/providers/registry";
import type { AiProviderId } from "@/config/content-engine";

export type { LlmMessage, LlmCompletionOptions };

export const llmService = {
  isConfigured: () => aiProviderRegistry.getActive().id !== "template",

  getActiveProviderId: () => aiProviderRegistry.getActive().id,

  async complete(
    messages: LlmMessage[],
    options?: LlmCompletionOptions & { providerId?: AiProviderId }
  ): Promise<string> {
    const provider = aiProviderRegistry.getActive(options?.providerId);
    return provider.complete(messages, options);
  },

  async completeJson<T>(
    messages: LlmMessage[],
    options?: LlmCompletionOptions & { providerId?: AiProviderId }
  ): Promise<T> {
    const provider = aiProviderRegistry.getActive(options?.providerId);
    return provider.completeJson<T>(messages, options);
  },
};
