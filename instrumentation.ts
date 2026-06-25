export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateStartupEnv } = await import("@/config/env");
    validateStartupEnv();
  }
}
