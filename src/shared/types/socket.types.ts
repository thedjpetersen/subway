/**
 * Socket.IO event type definitions
 * Defines the contract between client and server
 */

import { z } from 'zod';
import type { IrcConnection, UserSettings } from './irc.types.js';

// ============================================
// INCOMING EVENTS (Client -> Server) SCHEMAS
// ============================================

export const ConnectIrcPayloadSchema = z.object({
  server: z.string().min(1),
  nick: z.string().min(1).max(30),
  userName: z.string().optional(),
  channels: z.array(z.string()).optional(),
  password: z.string().optional(),
  port: z.number().int().positive().optional(),
  secure: z.boolean().optional(),
});
export type ConnectIrcPayload = z.infer<typeof ConnectIrcPayloadSchema>;

export const RemoveConnectionPayloadSchema = z.object({
  connection: z.string().min(1),
});
export type RemoveConnectionPayload = z.infer<typeof RemoveConnectionPayloadSchema>;

export const RegisterPayloadSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(128),
});
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;

export const SayPayloadSchema = z.object({
  server: z.string().min(1),
  target: z.string().min(1),
  text: z.string().min(1).max(512),
});
export type SayPayload = z.infer<typeof SayPayloadSchema>;

export const CommandPayloadSchema = z.object({
  server: z.string().min(1),
  target: z.string().min(1),
  command: z.string().max(512),
});
export type CommandPayload = z.infer<typeof CommandPayloadSchema>;

export const RawPayloadSchema = z.object({
  server: z.string().min(1),
  args: z.array(z.string()),
});
export type RawPayload = z.infer<typeof RawPayloadSchema>;

export const AddPluginPayloadSchema = z.object({
  plugin: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9]+$/),
});
export type AddPluginPayload = z.infer<typeof AddPluginPayloadSchema>;

export const SetActivePayloadSchema = z.object({
  active_server: z.string().optional(),
  active_channel: z.string().optional(),
});
export type SetActivePayload = z.infer<typeof SetActivePayloadSchema>;

export const ClearNotificationsPayloadSchema = z.object({
  server: z.object({ name: z.string() }),
  channel: z.string(),
});
export type ClearNotificationsPayload = z.infer<typeof ClearNotificationsPayloadSchema>;

export const CloseChannelPayloadSchema = z.object({
  server: z.string().min(1),
  target: z.string().min(1),
});
export type CloseChannelPayload = z.infer<typeof CloseChannelPayloadSchema>;

export const LoadHistoryPayloadSchema = z.object({
  server: z.string().min(1),
  channel: z.string().min(1),
  timestamp: z.number().int().positive(),
});
export type LoadHistoryPayload = z.infer<typeof LoadHistoryPayloadSchema>;

export const SaveSettingsPayloadSchema = z.record(z.unknown());
export type SaveSettingsPayload = z.infer<typeof SaveSettingsPayloadSchema>;

// ============================================
// OUTGOING EVENTS (Server -> Client) TYPES
// ============================================

export interface RawIrcMessage {
  rawCommand: string;
  command: string;
  commandType?: string;
  args: string[];
  prefix?: string;
  nick?: string;
  user?: string;
  host?: string;
  client_server: string;
}

export interface RestoreConnectionPayload {
  connections: IrcConnection[];
  active_server?: string;
  active_channel?: string;
  notifications?: number;
}

export interface ConnectionErrorPayload {
  server: string;
  nick: string;
}

export interface ConnectionRemovedPayload {
  connection: string;
}

export interface RegisterSuccessPayload {
  username: string;
}

export interface RegisterErrorPayload {
  message: string;
}

export interface PluginAddedPayload {
  plugin: string;
}

export interface HistoryPayload {
  messages: Array<{
    id: number;
    from: string;
    text: string | null;
    type: string;
    timestamp: Date;
    attributes?: Record<string, unknown>;
  }>;
  server: string;
  channel: string;
}

// ============================================
// SOCKET.IO EVENT MAPS
// ============================================

/** Events the client can emit to the server */
export interface ClientToServerEvents {
  connectirc: (data: ConnectIrcPayload) => void;
  remove_connection: (data: RemoveConnectionPayload) => void;
  disconnect: () => void;
  register: (data: RegisterPayload) => void;
  say: (data: SayPayload) => void;
  command: (data: CommandPayload) => void;
  raw: (data: RawPayload) => void;
  add_plugin: (data: AddPluginPayload) => void;
  set_active: (data: SetActivePayload) => void;
  clearnotifications: (data: ClearNotificationsPayload) => void;
  closeChannel: (data: CloseChannelPayload) => void;
  loadHistory: (data: LoadHistoryPayload) => void;
  saveSettings: (data: UserSettings) => void;
}

/** Events the server can emit to the client */
export interface ServerToClientEvents {
  raw: (message: RawIrcMessage) => void;
  restore_connection: (data: RestoreConnectionPayload) => void;
  connection_error: (data: ConnectionErrorPayload) => void;
  connection_removed: (data: ConnectionRemovedPayload) => void;
  register_success: (data: RegisterSuccessPayload) => void;
  register_error: (data: RegisterErrorPayload) => void;
  plugin_added: (data: PluginAddedPayload) => void;
  history: (data: HistoryPayload) => void;
}

/** Inter-server events (not used for client-server communication) */
export interface InterServerEvents {
  ping: () => void;
}

/** Socket data attached to each connection */
export interface SocketData {
  userId?: string;
  username?: string;
  loggedIn: boolean;
}
