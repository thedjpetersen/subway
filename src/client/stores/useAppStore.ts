/**
 * Main application store
 * Manages IRC connections, channels, messages, and users
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  IrcConnection,
  IrcChannel,
  IrcMessage,
  IrcUser,
} from '@shared/types/irc.types';

interface AppState {
  // State
  connections: Record<string, IrcConnection>;
  activeServer: string | null;
  activeChannel: string | null;
  notifications: number;
  initialized: boolean;
  showMainMenu: boolean;

  // UI actions
  setShowMainMenu: (show: boolean) => void;

  // Connection actions
  addServer: (serverName: string, nick?: string) => void;
  removeServer: (serverName: string) => void;
  setActiveServer: (serverName: string) => void;
  updateServerNick: (serverName: string, nick: string) => void;
  setServerMotd: (serverName: string, motd: string) => void;

  // Channel actions
  addChannel: (serverName: string, channelName: string) => void;
  removeChannel: (serverName: string, channelName: string) => void;
  setActiveChannel: (channelName: string) => void;
  setChannelTopic: (serverName: string, channelName: string, topic: string) => void;
  clearChannelNotifications: (serverName: string, channelName: string) => void;
  incrementUnread: (serverName: string, channelName: string) => void;

  // Message actions
  addMessage: (serverName: string, channelName: string, message: IrcMessage) => void;
  prependMessages: (serverName: string, channelName: string, messages: IrcMessage[]) => void;
  markHistoryFetched: (serverName: string, channelName: string, allFetched?: boolean) => void;

  // User actions
  addUser: (serverName: string, channelName: string, user: IrcUser | IrcUser[]) => void;
  removeUser: (serverName: string, channelName: string, nick: string) => void;
  updateUserNick: (serverName: string, oldNick: string, newNick: string) => void;
  updateUserMode: (serverName: string, channelName: string, nick: string, type: '@' | '+' | '') => void;

  // Notification actions
  setNotifications: (delta: number) => void;

  // Initialization
  setInitialized: (initialized: boolean) => void;
  restoreState: (data: Partial<AppState>) => void;
  reset: () => void;

  // Selectors
  getActiveConnection: () => IrcConnection | null;
  getActiveChannelData: () => IrcChannel | null;
  getActiveNick: () => string | null;
}

const createEmptyChannel = (name: string): IrcChannel => ({
  name,
  topic: '',
  messages: [],
  users: [],
  unread: 0,
  highlights: {},
  history: [],
  historyOffset: 0,
  fetched: false,
  allFetched: false,
});

const createEmptyConnection = (name: string, nick = ''): IrcConnection => ({
  name,
  nick,
  channels: {},
  channelList: [],
  motd: '',
});

const initialState = {
  connections: {},
  activeServer: null,
  activeChannel: null,
  notifications: 0,
  initialized: false,
  showMainMenu: true,
};

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    ...initialState,

    // UI actions
    setShowMainMenu: (show) =>
      set((state) => {
        state.showMainMenu = show;
      }),

    // Connection actions
    addServer: (serverName, nick = '') =>
      set((state) => {
        if (!state.connections[serverName]) {
          state.connections[serverName] = createEmptyConnection(serverName, nick);
        }
      }),

    removeServer: (serverName) =>
      set((state) => {
        delete state.connections[serverName];
        if (state.activeServer === serverName) {
          const servers = Object.keys(state.connections);
          state.activeServer = servers[0] || null;
          state.activeChannel = null;
        }
      }),

    setActiveServer: (serverName) =>
      set((state) => {
        state.activeServer = serverName;
      }),

    updateServerNick: (serverName, nick) =>
      set((state) => {
        if (state.connections[serverName]) {
          state.connections[serverName].nick = nick;
        }
      }),

    setServerMotd: (serverName, motd) =>
      set((state) => {
        if (state.connections[serverName]) {
          state.connections[serverName].motd = motd;
        }
      }),

    // Channel actions
    addChannel: (serverName, channelName) =>
      set((state) => {
        const server = state.connections[serverName];
        if (server && !server.channels[channelName]) {
          server.channels[channelName] = createEmptyChannel(channelName);
        }
      }),

    removeChannel: (serverName, channelName) =>
      set((state) => {
        const server = state.connections[serverName];
        if (server) {
          delete server.channels[channelName];
          if (state.activeChannel === channelName) {
            const channels = Object.keys(server.channels);
            state.activeChannel = channels[0] || 'status';
          }
        }
      }),

    setActiveChannel: (channelName) =>
      set((state) => {
        state.activeChannel = channelName;
      }),

    setChannelTopic: (serverName, channelName, topic) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          channel.topic = topic;
        }
      }),

    clearChannelNotifications: (serverName, channelName) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          const prevUnread = channel.unread;
          channel.unread = 0;
          channel.highlights = {};
          state.notifications = Math.max(0, state.notifications - prevUnread);
        }
      }),

    incrementUnread: (serverName, channelName) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          channel.unread++;
        }
      }),

    // Message actions
    addMessage: (serverName, channelName, message) =>
      set((state) => {
        // Ensure channel exists
        const server = state.connections[serverName];
        if (!server) return;

        if (!server.channels[channelName]) {
          server.channels[channelName] = createEmptyChannel(channelName);
        }

        const channel = server.channels[channelName];
        channel.messages.push(message);

        // Increment unread if not active channel
        if (
          state.activeServer !== serverName ||
          state.activeChannel !== channelName
        ) {
          if (message.type === 'PRIVMSG') {
            channel.unread++;
          }
        }
      }),

    prependMessages: (serverName, channelName, messages) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          channel.messages = [...messages, ...channel.messages];
        }
      }),

    markHistoryFetched: (serverName, channelName, allFetched = false) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          channel.fetched = true;
          if (allFetched) {
            channel.allFetched = true;
          }
        }
      }),

    // User actions
    addUser: (serverName, channelName, user) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          const users = Array.isArray(user) ? user : [user];
          for (const u of users) {
            // Don't add if already exists
            if (!channel.users.find((existing) => existing.nick === u.nick)) {
              channel.users.push(u);
            }
          }
        }
      }),

    removeUser: (serverName, channelName, nick) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          channel.users = channel.users.filter((u) => u.nick !== nick);
        }
      }),

    updateUserNick: (serverName, oldNick, newNick) =>
      set((state) => {
        const server = state.connections[serverName];
        if (!server) return;

        // Update nick in all channels
        for (const channel of Object.values(server.channels)) {
          const user = channel.users.find((u) => u.nick === oldNick);
          if (user) {
            user.nick = newNick;
          }
        }
      }),

    updateUserMode: (serverName, channelName, nick, type) =>
      set((state) => {
        const channel = state.connections[serverName]?.channels[channelName];
        if (channel) {
          const user = channel.users.find((u) => u.nick === nick);
          if (user) {
            user.type = type;
          }
        }
      }),

    // Notification actions
    setNotifications: (delta) =>
      set((state) => {
        state.notifications = Math.max(0, state.notifications + delta);
      }),

    // Initialization
    setInitialized: (initialized) =>
      set((state) => {
        state.initialized = initialized;
      }),

    restoreState: (data) =>
      set((state) => {
        if (data.connections) {
          state.connections = data.connections;
        }
        if (data.activeServer) {
          state.activeServer = data.activeServer;
        }
        if (data.activeChannel) {
          state.activeChannel = data.activeChannel;
        }
        if (data.notifications !== undefined) {
          state.notifications = data.notifications;
        }
        state.initialized = true;
      }),

    reset: () => set(initialState),

    // Selectors
    getActiveConnection: () => {
      const { activeServer, connections } = get();
      return activeServer ? connections[activeServer] || null : null;
    },

    getActiveChannelData: () => {
      const { activeServer, activeChannel, connections } = get();
      if (activeServer && activeChannel) {
        return connections[activeServer]?.channels[activeChannel] || null;
      }
      return null;
    },

    getActiveNick: () => {
      const connection = get().getActiveConnection();
      return connection?.nick || null;
    },
  }))
);
