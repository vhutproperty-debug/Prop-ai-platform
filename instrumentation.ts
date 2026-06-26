export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    if (process.platform === "win32") {
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    }
    const { validateStartupEnv } = await import("@/config/env");
    validateStartupEnv();
  }
}
