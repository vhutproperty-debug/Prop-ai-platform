import type { ImportSource } from "@/config/ingestion";
import type { IngestionLogEntry } from "@/types/ingestion";

export class IngestionLogger {
  private logs: IngestionLogEntry[] = [];

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log("error", message, meta);
  }

  private log(
    level: IngestionLogEntry["level"],
    message: string,
    meta?: Record<string, unknown>
  ) {
    const entry: IngestionLogEntry = {
      level,
      message,
      timestamp: new Date(),
      meta,
    };
    this.logs.push(entry);
    const prefix = `[Ingestion:${level.toUpperCase()}]`;
    if (level === "error") {
      console.error(prefix, message, meta ?? "");
    } else if (level === "warn") {
      console.warn(prefix, message, meta ?? "");
    } else {
      console.info(prefix, message, meta ?? "");
    }
  }

  getLogs(): IngestionLogEntry[] {
    return [...this.logs];
  }

  merge(other: IngestionLogger) {
    this.logs.push(...other.getLogs());
  }
}

export function createJobLogger(source: ImportSource, jobId?: string) {
  const logger = new IngestionLogger();
  logger.info("Ingestion started", { source, jobId });
  return logger;
}
