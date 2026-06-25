import { env } from "@/config/env";

const isDev = env.NODE_ENV === "development";

export const dbLogger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (!isDev) return;
    console.info(`[MongoDB] ${message}`, meta ?? "");
  },

  warn(message: string, meta?: Record<string, unknown>) {
    if (!isDev) return;
    console.warn(`[MongoDB] ${message}`, meta ?? "");
  },

  error(message: string, meta?: Record<string, unknown>) {
    if (!isDev) return;
    console.error(`[MongoDB] ${message}`, meta ?? "");
  },

  slowQuery(collection: string, method: string, durationMs: number, query?: unknown) {
    if (!isDev) return;
    if (durationMs < 100) return;
    console.warn(`[MongoDB] Slow query ${durationMs}ms`, {
      collection,
      method,
      query,
    });
  },

  writeFailure(collection: string, error: unknown) {
    if (!isDev) return;
    console.error(`[MongoDB] Write failed on ${collection}`, error);
  },

  validationError(model: string, error: unknown) {
    if (!isDev) return;
    console.error(`[MongoDB] Validation error on ${model}`, error);
  },
};
