/**
 * Socket connection state manager
 * Manages active IRC connections and user states
 */

import type { Client as IrcClient } from 'irc';
import type { Socket } from 'socket.io';
import type { IrcAppState } from '@shared/types/index.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared/types/index.js';

/** Typed socket with our event definitions */
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/** Active connection state for a user */
export interface UserConnection {
  clients: Map<string, IrcClient>;
  ircState: IrcAppState | null;
}

/** Map of username -> active connection state */
const connections = new Map<string, UserConnection>();

/**
 * Get or create connection state for a user
 */
export function getUserConnection(username: string): UserConnection {
  let conn = connections.get(username);
  if (!conn) {
    conn = {
      clients: new Map(),
      ircState: null,
    };
    connections.set(username, conn);
  }
  return conn;
}

/**
 * Check if a user has active connections
 */
export function hasActiveConnection(username: string): boolean {
  const conn = connections.get(username);
  return conn !== undefined && conn.clients.size > 0;
}

/**
 * Get IRC client for a user's server
 */
export function getIrcClient(
  username: string,
  server: string
): IrcClient | undefined {
  return connections.get(username)?.clients.get(server);
}

/**
 * Add IRC client for a user's server
 */
export function addIrcClient(
  username: string,
  server: string,
  client: IrcClient
): void {
  const conn = getUserConnection(username);
  conn.clients.set(server, client);
}

/**
 * Remove IRC client for a user's server
 */
export function removeIrcClient(username: string, server: string): void {
  const conn = connections.get(username);
  if (conn) {
    const client = conn.clients.get(server);
    if (client) {
      try {
        client.disconnect('Closing connection');
      } catch {
        // Ignore disconnect errors
      }
      conn.clients.delete(server);
    }
  }
}

/**
 * Remove all IRC clients for a user
 */
export function removeAllIrcClients(username: string): void {
  const conn = connections.get(username);
  if (conn) {
    for (const [server, client] of conn.clients) {
      try {
        client.disconnect('Closing connection');
      } catch {
        // Ignore disconnect errors
      }
    }
    conn.clients.clear();
  }
}

/**
 * Store IRC app state for a user
 */
export function setIrcState(username: string, state: IrcAppState): void {
  const conn = getUserConnection(username);
  conn.ircState = state;
}

/**
 * Get IRC app state for a user
 */
export function getIrcState(username: string): IrcAppState | null {
  return connections.get(username)?.ircState ?? null;
}

/**
 * Remove user connection entirely
 */
export function removeUserConnection(username: string): void {
  removeAllIrcClients(username);
  connections.delete(username);
}

/**
 * Get all active connections (for admin/debug)
 */
export function getAllConnections(): Map<string, UserConnection> {
  return connections;
}

/**
 * Close all IRC connections (for graceful shutdown)
 */
export function closeAllConnections(): void {
  for (const [username, conn] of connections) {
    for (const [server, client] of conn.clients) {
      try {
        // Remove all listeners to prevent memory leaks
        client.removeAllListeners();
        client.disconnect('Server shutting down');
      } catch {
        // Ignore disconnect errors
      }
    }
    conn.clients.clear();
  }
  connections.clear();
}
