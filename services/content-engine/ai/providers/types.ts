export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AiProvider {
  id: string;
  isAvailable(): boolean;
  complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<string>;
  completeJson<T>(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<T>;
}
