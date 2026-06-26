const dns = require("dns");
if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}
