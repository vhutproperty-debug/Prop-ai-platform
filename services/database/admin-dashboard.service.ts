import mongoose from "mongoose";
import { connectDB, getConnectionInfo } from "@/lib/db/mongodb";
import { getDbConnectionState } from "@/lib/db/connection-state";
import { env, isDbConfigured } from "@/config/env";

export interface CollectionStat {
  name: string;
  documentCount: number;
  indexCount: number;
  indexes: Array<{ name: string; key: Record<string, unknown> }>;
}

export interface DatabaseDashboardData {
  connection: ReturnType<typeof getConnectionInfo> & {
    lastConnectedAt: string | null;
    lastError: string | null;
    reconnectAttempts: number;
    connectionAttempts: number;
  };
  environment: string;
  collections: CollectionStat[];
  totalDocuments: number;
  recentErrors: Array<{ message: string; at: string }>;
}

export const databaseAdminService = {
  async getDashboard(): Promise<DatabaseDashboardData> {
    if (!isDbConfigured) {
      throw new Error("MONGODB_URI is not configured");
    }

    await connectDB();
    const state = getDbConnectionState();
    const connection = getConnectionInfo();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database handle unavailable");
    }

    const collectionNames = (await db.listCollections().toArray())
      .map((c) => c.name)
      .sort();

    const collections: CollectionStat[] = [];
    let totalDocuments = 0;

    for (const name of collectionNames) {
      const coll = db.collection(name);
      const [documentCount, indexes] = await Promise.all([
        coll.countDocuments(),
        coll.indexes(),
      ]);

      totalDocuments += documentCount;
      collections.push({
        name,
        documentCount,
        indexCount: indexes.length,
        indexes: indexes.map((idx) => ({
          name: idx.name ?? "_unknown",
          key: idx.key as Record<string, unknown>,
        })),
      });
    }

    return {
      connection: {
        ...connection,
        lastConnectedAt: state.lastConnectedAt,
        lastError: state.lastError,
        reconnectAttempts: state.reconnectAttempts,
        connectionAttempts: state.connectionAttempts,
      },
      environment: env.NODE_ENV,
      collections,
      totalDocuments,
      recentErrors: state.recentErrors,
    };
  },

  getRegisteredModels() {
    return mongoose.modelNames();
  },
};
