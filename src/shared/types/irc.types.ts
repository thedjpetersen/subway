/**
 * IRC-related type definitions
 * These types are shared between client and server
 */

/** IRC message types corresponding to IRC commands */
export type MessageType =
  | 'PRIVMSG'
  | 'NOTICE'
  | 'JOIN'
  | 'PART'
  | 'QUIT'
  | 'KICK'
  | 'NICK'
  | 'MODE'
  | 'TOPIC'
  | 'ACTION';

/** A single IRC message */
export interface IrcMessage {
  id: string;
  type: MessageType | string;
  from: string;
  text: string;
  timestamp: number;
  // Type-specific optional fields
  nick?: string;
  mode?: string;
  reason?: string;
  specialType?: 'MOTD';
  attributes?: Record<string, unknown>;
}

/** Alias for backward compatibility */
export type Message = IrcMessage;

/** A user in an IRC channel */
export interface IrcUser {
  nick: string;
  type: '@' | '+' | '';
  lastActive?: number;
  updated: number;
}

/** An IRC channel */
export interface IrcChannel {
  name: string;
  topic?: string;
  messages: IrcMessage[];
  users: IrcUser[];
  unread: number;
  highlights: Record<string, number>;
  history: string[];
  historyOffset: number;
  fetched: boolean;
  allFetched: boolean;
}

/** Channel list item from /list command */
export interface ChannelListItem {
  channel: string;
  users: number;
  topic: string;
}

/** An IRC server connection */
export interface IrcConnection {
  name: string;
  nick: string;
  channels: Record<string, IrcChannel>;
  channelList: ChannelListItem[];
  motd?: string;
}

/** Application state for IRC connections */
export interface IrcAppState {
  connections: Record<string, IrcConnection>;
  activeServer: string | null;
  activeChannel: string | null;
  notifications: number;
  initialized: boolean;
}

/** User highlight configuration */
export interface Highlight {
  name: string;
  regex: string;
  color: string;
  notify: boolean;
}

/** User settings/preferences */
export interface UserSettings {
  timeFormat: string;
  enabledTypes: MessageType[];
  disabledTypes: MessageType[];
  highlights: Highlight[];
  plugins: string[];
  activePlugins: string[];
  notifyPm: boolean;
}

/** Plugin metadata */
export interface PluginData {
  pluginId: string;
  name?: string;
  author: string;
  description: string;
  gist?: string;
  settings?: Record<string, unknown>;
}
