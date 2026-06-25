import type { AiProviderId } from "@/config/content-engine";
import type { AiProvider } from "@/services/content-engine/ai/providers/types";
import { openAiProvider } from "@/services/content-engine/ai/providers/openai.provider";
import { templateAiProvider } from "@/services/content-engine/ai/providers/template.provider";

const providers = new Map<string, AiProvider>([
  [openAiProvider.id, openAiProvider],
  [templateAiProvider.id, templateAiProvider],
]);

export const aiProviderRegistry = {
  register(provider: AiProvider) {
    providers.set(provider.id, provider);
  },

  get(id: AiProviderId): AiProvider {
    const provider = providers.get(id);
    if (!provider) throw new Error(`AI provider not found: ${id}`);
    return provider;
  },

  getActive(preferred?: AiProviderId): AiProvider {
    if (preferred) {
      const p = providers.get(preferred);
      if (p?.isAvailable()) return p;
    }
    for (const id of ["openai", "template"] as AiProviderId[]) {
      const p = providers.get(id);
      if (p?.isAvailable()) return p;
    }
    return templateAiProvider;
  },

  listAvailable(): AiProvider[] {
    return [...providers.values()].filter((p) => p.isAvailable());
  },
};
