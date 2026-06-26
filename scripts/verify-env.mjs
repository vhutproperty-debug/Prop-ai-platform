import { loadEnvFiles } from "../lib/env/load-env-file.js";

loadEnvFiles();

const { validateStartupEnv, isDbConfigured, isAuthConfigured, env } = await import("../config/env.js");

validateStartupEnv();

console.log("[Verify-Env] MONGODB_URI configured:", isDbConfigured);
console.log("[Verify-Env] JWT_SECRET configured:", isAuthConfigured);
console.log("[Verify-Env] NEXT_PUBLIC_APP_URL:", env.NEXT_PUBLIC_APP_URL);
console.log("[Verify-Env] NODE_ENV:", env.NODE_ENV);

if (!isDbConfigured || !isAuthConfigured) process.exit(1);
