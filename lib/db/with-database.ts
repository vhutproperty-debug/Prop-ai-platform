import { isDbConfigured } from "@/config/env";
import { connectDB } from "@/lib/db/mongodb";

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  if (!isDbConfigured) {
    throw new Error("Database is not configured");
  }
  await connectDB();
  return fn();
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
