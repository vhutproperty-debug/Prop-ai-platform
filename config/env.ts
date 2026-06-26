import { z } from "zod";

function loadEnvIfNeeded(): void {
  if (typeof window !== "undefined" || process.env.MONGODB_URI) return;
  try {
    // Dynamic require keeps fs out of client bundles.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/lib/env/load-env-file").loadEnvFiles();
  } catch {
    // ignore when unavailable (edge/client analysis)
  }
}

const mongoUriSchema = z
  .string()
  .min(1, "MONGODB_URI is required")
  .refine(
    (uri) => /^mongodb(\+srv)?:\/\//.test(uri),
    "MONGODB_URI must start with mongodb:// or mongodb+srv://"
  );

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGODB_URI: mongoUriSchema.optional(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  CRM_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  FIRECRAWL_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string[]>
  ) {
    super(message);
    this.name = "EnvValidationError";
  }
}

function formatFieldErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([key, msgs]) => `  ${key}: ${msgs.join(", ")}`)
    .join("\n");
}

function parseEnv(): Env {
  loadEnvIfNeeded();

  const result = envSchema.safeParse(process.env);

  if (result.success) {
    return result.data;
  }

  const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;

  if (process.env.NODE_ENV === "production") {
    throw new EnvValidationError(
      `Invalid environment configuration:\n${formatFieldErrors(fieldErrors)}`,
      fieldErrors
    );
  }

  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    CRM_WEBHOOK_URL: process.env.CRM_WEBHOOK_URL,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  });
}

export const env = parseEnv();

/** Validates required vars for database-backed local development. */
export function validateStartupEnv(): void {
  const requiredSchema = z.object({
    MONGODB_URI: mongoUriSchema,
    JWT_SECRET: z.string().min(32),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  });

  const result = requiredSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
    const message = [
      "[PropAI] Missing or invalid environment variables.",
      "Copy .env.example to .env.local and configure MongoDB Atlas:",
      formatFieldErrors(fieldErrors),
    ].join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new EnvValidationError(message, fieldErrors);
    }

    console.error(message);
  }
}

export function validateMongoUri(uri: string): { valid: boolean; error?: string } {
  const result = mongoUriSchema.safeParse(uri);
  if (result.success) return { valid: true };
  return {
    valid: false,
    error: result.error.issues[0]?.message ?? "Invalid MongoDB URI",
  };
}

export function requireEnv(key: keyof Pick<Env, "MONGODB_URI" | "JWT_SECRET">): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${key} is required but not set. Add it to .env.local`);
  }
  return value;
}

export const isDbConfigured = Boolean(env.MONGODB_URI);
export const isAuthConfigured = Boolean(env.JWT_SECRET);
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);
export const isAiConfigured = Boolean(env.OPENAI_API_KEY);
export const isFirecrawlConfigured = Boolean(env.FIRECRAWL_API_KEY);

export function getMongoUriSafeSummary(uri: string): {
  protocol: string;
  host: string;
  database: string;
  isAtlas: boolean;
} {
  const isSrv = uri.startsWith("mongodb+srv://");
  const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "https://");
  try {
    const url = new URL(normalized);
    const database = url.pathname.replace(/^\//, "").split("?")[0] || "propai";
    return {
      protocol: isSrv ? "mongodb+srv" : "mongodb",
      host: url.hostname,
      database,
      isAtlas: url.hostname.includes(".mongodb.net"),
    };
  } catch {
    return {
      protocol: isSrv ? "mongodb+srv" : "mongodb",
      host: "unknown",
      database: "unknown",
      isAtlas: isSrv,
    };
  }
}
