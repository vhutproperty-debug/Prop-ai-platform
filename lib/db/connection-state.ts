import { isDbConfigured } from "@/config/env";

export interface DbConnectionState {
  connected: boolean;
  readyState: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastError: string | null;
  reconnectAttempts: number;
  connectionAttempts: number;
  recentErrors: Array<{ message: string; at: string }>;
}

const MAX_RECENT_ERRORS = 20;

export const dbConnectionState: DbConnectionState = {
  connected: false,
  readyState: 0,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastError: null,
  reconnectAttempts: 0,
  connectionAttempts: 0,
  recentErrors: [],
};

export function recordConnectionSuccess() {
  dbConnectionState.connected = true;
  dbConnectionState.lastConnectedAt = new Date().toISOString();
  dbConnectionState.lastError = null;
}

export function recordConnectionAttempt() {
  dbConnectionState.connectionAttempts += 1;
}

export function recordReconnectAttempt() {
  dbConnectionState.reconnectAttempts += 1;
}

export function recordConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  dbConnectionState.connected = false;
  dbConnectionState.lastError = message;
  dbConnectionState.recentErrors.unshift({
    message,
    at: new Date().toISOString(),
  });
  if (dbConnectionState.recentErrors.length > MAX_RECENT_ERRORS) {
    dbConnectionState.recentErrors.length = MAX_RECENT_ERRORS;
  }
}

export function recordDisconnected() {
  dbConnectionState.connected = false;
  dbConnectionState.lastDisconnectedAt = new Date().toISOString();
}

export function updateReadyState(readyState: number) {
  dbConnectionState.readyState = readyState;
  dbConnectionState.connected = readyState === 1 && isDbConfigured;
}

export function getDbConnectionState(): DbConnectionState {
  return { ...dbConnectionState, recentErrors: [...dbConnectionState.recentErrors] };
}
