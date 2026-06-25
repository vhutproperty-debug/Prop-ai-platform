import { isDbConfigured } from "@/config/env";
import { connectDB } from "@/lib/db/mongodb";

import { dbLogger } from "@/lib/db/logger";

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  if (!isDbConfigured) {
    throw new Error(
      "Database is not configured. Set MONGODB_URI in .env.local"
    );
  }
  try {
    await connectDB();
    return await fn();
  } catch (error) {
    dbLogger.error("withDatabase operation failed", {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

export async function tryDatabase<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isDbConfigured) return null;
  try {
    await connectDB();
    return await fn();
  } catch (error) {
    console.error("[Database]", error);
    return null;
  }
}
