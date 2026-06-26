import dns from "dns";

if (typeof window === "undefined" && process.platform === "win32") {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}
