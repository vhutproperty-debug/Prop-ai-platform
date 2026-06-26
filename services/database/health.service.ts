import "@/lib/db/setup-dns";
import mongoose from "mongoose";
import { connectDB, getConnectionInfo } from "@/lib/db/mongodb";
import { getDbConnectionState } from "@/lib/db/connection-state";
import { isDbConfigured } from "@/config/env";

export interface DatabaseHealthReport {
  mongodb: {
    status: "healthy" | "unhealthy" | "not_configured";
    connected: boolean;
    databaseName: string | null;
    cluster: {
      protocol: string;
      host: string;
      isAtlas: boolean;
    } | null;
    environment: string;
    mongooseVersion: string;
    responseTimeMs: number;
    collections: string[];
    readyState: number;
    lastConnectedAt: string | null;
    lastError: string | null;
  };
  timestamp: string;
}

export interface DatabaseHealthCheckOptions {
  /** When false, skips listCollections (faster; collections returns []). */
  includeCollections?: boolean;
}

export const databaseHealthService = {
  async check(
    options: DatabaseHealthCheckOptions = {}
  ): Promise<DatabaseHealthReport> {
    const includeCollections = options.includeCollections !== false;
    const started = Date.now();
    const base = getConnectionInfo();
    const state = getDbConnectionState();

    if (!isDbConfigured) {
      return {
        mongodb: {
          status: "not_configured",
          connected: false,
          databaseName: null,
          cluster: null,
          environment: base.environment,
          mongooseVersion: base.mongooseVersion,
          responseTimeMs: Date.now() - started,
          collections: [],
          readyState: 0,
          lastConnectedAt: state.lastConnectedAt,
          lastError: state.lastError,
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await connectDB();
      const db = mongoose.connection.db;
      const collections =
        db && includeCollections
          ? (await db.listCollections().toArray()).map((c) => c.name).sort()
          : [];

      return {
        mongodb: {
          status: "healthy",
          connected: true,
          databaseName: mongoose.connection.name,
          cluster: base.cluster,
          environment: base.environment,
          mongooseVersion: base.mongooseVersion,
          responseTimeMs: Date.now() - started,
          collections,
          readyState: mongoose.connection.readyState,
          lastConnectedAt: state.lastConnectedAt,
          lastError: null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        mongodb: {
          status: "unhealthy",
          connected: false,
          databaseName: base.database ?? null,
          cluster: base.cluster,
          environment: base.environment,
          mongooseVersion: base.mongooseVersion,
          responseTimeMs: Date.now() - started,
          collections: [],
          readyState: mongoose.connection.readyState,
          lastConnectedAt: state.lastConnectedAt,
          lastError: error instanceof Error ? error.message : "Connection failed",
        },
        timestamp: new Date().toISOString(),
      };
    }
  },
};
