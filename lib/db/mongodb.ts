import "@/lib/db/setup-dns";
import mongoose from "mongoose";
import {
  env,
  getMongoUriSafeSummary,
  isDbConfigured,
  requireEnv,
  validateMongoUri,
} from "@/config/env";
import { ensureIndexes } from "@/lib/db/indexes";
import {
  recordConnectionAttempt,
  recordConnectionError,
  recordConnectionSuccess,
  recordDisconnected,
  recordReconnectAttempt,
  updateReadyState,
} from "@/lib/db/connection-state";
import { dbLogger } from "@/lib/db/logger";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const SERVER_SELECTION_TIMEOUT_MS = 15_000;
const SOCKET_TIMEOUT_MS = 45_000;
const CONNECT_TIMEOUT_MS = 15_000;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  indexesSynced: boolean;
  listenersAttached: boolean;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  indexesSynced: false,
  listenersAttached: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function attachConnectionListeners() {
  if (cached.listenersAttached) return;
  cached.listenersAttached = true;

  mongoose.connection.on("connected", () => {
    updateReadyState(mongoose.connection.readyState);
    recordConnectionSuccess();
    dbLogger.info("Connected", {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  });

  mongoose.connection.on("error", (error) => {
    updateReadyState(mongoose.connection.readyState);
    recordConnectionError(error);
    dbLogger.error("Connection error", { error: error.message });
  });

  mongoose.connection.on("disconnected", () => {
    updateReadyState(mongoose.connection.readyState);
    recordDisconnected();
    cached.conn = null;
    cached.promise = null;
    dbLogger.warn("Disconnected");
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(uri: string): Promise<typeof mongoose> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      recordConnectionAttempt();
      if (attempt > 1) recordReconnectAttempt();

      const connection = await mongoose.connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
        socketTimeoutMS: SOCKET_TIMEOUT_MS,
        connectTimeoutMS: CONNECT_TIMEOUT_MS,
        retryWrites: true,
        autoIndex: false,
      });

      return connection;
    } catch (error) {
      lastError = error;
      recordConnectionError(error);
      dbLogger.warn(`Connection attempt ${attempt}/${MAX_RETRIES} failed`, {
        error: error instanceof Error ? error.message : error,
      });

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_MS * attempt);
        cached.promise = null;
      }
    }
  }

  throw new Error(
    `Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${
      lastError instanceof Error ? lastError.message : "Unknown error"
    }`
  );
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!isDbConfigured) {
    throw new Error(
      "MONGODB_URI is not configured. Add your MongoDB Atlas URI to .env.local"
    );
  }

  const uri = requireEnv("MONGODB_URI");
  const validation = validateMongoUri(uri);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Invalid MONGODB_URI");
  }

  attachConnectionListeners();

  if (cached.conn && mongoose.connection.readyState === 1) {
    updateReadyState(1);
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry(uri);
  }

  try {
    cached.conn = await cached.promise;
    updateReadyState(mongoose.connection.readyState);

    if (!cached.indexesSynced) {
      try {
        await ensureIndexes();
        cached.indexesSynced = true;
        dbLogger.info("Indexes synchronized");
      } catch (error) {
        dbLogger.warn("Index sync skipped", {
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
  cached.indexesSynced = false;
  updateReadyState(0);
  dbLogger.info("Graceful shutdown complete");
}

export function getConnectionInfo() {
  const uri = env.MONGODB_URI ?? "";
  const summary = uri ? getMongoUriSafeSummary(uri) : null;

  return {
    readyState: mongoose.connection.readyState,
    connected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || summary?.host,
    database: mongoose.connection.name || summary?.database,
    cluster: summary
      ? {
          protocol: summary.protocol,
          host: summary.host,
          isAtlas: summary.isAtlas,
        }
      : null,
    mongooseVersion: mongoose.version,
    environment: env.NODE_ENV,
  };
}

if (typeof process !== "undefined") {
  const shutdown = async () => {
    try {
      await disconnectDB();
    } catch {
      // ignore shutdown errors
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
