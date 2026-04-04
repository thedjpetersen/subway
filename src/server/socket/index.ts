/**
 * Socket.IO setup and handler registration
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared/types/index.js';
import {
  ConnectIrcPayloadSchema,
  RemoveConnectionPayloadSchema,
  RegisterPayloadSchema,
  SayPayloadSchema,
  CommandPayloadSchema,
  RawPayloadSchema,
  AddPluginPayloadSchema,
  SetActivePayloadSchema,
  ClearNotificationsPayloadSchema,
  CloseChannelPayloadSchema,
  LoadHistoryPayloadSchema,
} from '@shared/types/index.js';
import { validateSocketPayload } from '../middleware/validation.js';
import { checkSocketRateLimit } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';
import {
  type TypedSocket,
  getUserConnection,
  addIrcClient,
  removeIrcClient,
  setIrcState,
  getIrcState,
  hasActiveConnection,
} from './state.js';
import {
  createUser,
} from '../services/user.service.js';
import {
  saveSettings,
} from '../services/settings.service.js';
import {
  loadHistory,
} from '../services/message.service.js';
import {
  saveConnectionState,
  getConnectionState,
} from '../services/connection.service.js';
import { createRequire } from 'module';
import util from 'util';

// Polyfill for util.log which was removed in Node.js 25
// Required by the legacy 'irc' package
if (!util.log) {
  (util as any).log = (msg: string) => {
    console.log(`${new Date().toISOString()} - ${msg}`);
  };
}

// Note: irc module types are not available, using createRequire for CommonJS module
const require = createRequire(import.meta.url);
const irc = require('irc');

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HttpServer): TypedServer {
  const io: TypedServer = new Server(httpServer, {
    cors: {
      origin: '*', // Configure appropriately for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: TypedSocket) => {
    const clientIp = socket.handshake.address;

    // Rate limit socket connections
    if (!checkSocketRateLimit(clientIp)) {
      logger.warn('Socket connection rate limited', { ip: clientIp });
      socket.disconnect(true);
      return;
    }

    logger.info('Socket connected', { id: socket.id, ip: clientIp });

    // Initialize socket data
    socket.data.loggedIn = false;

    // Track IRC clients for this socket
    const socketClients = new Map<string, typeof irc.Client>();

    /**
     * Connect to an IRC server
     */
    socket.on('connectirc', (data) => {
      const validated = validateSocketPayload(
        ConnectIrcPayloadSchema,
        data
      );
      if (!validated) return;

      const connectData = {
        userName: validated.userName ?? 'subway',
        channels: validated.channels ?? [],
        debug: true,
        retryCount: 1,
        autoRejoin: false,
        ...validated,
      };

      const client = new irc.Client(validated.server, validated.nick, connectData);

      client.on('abort', () => {
        socket.emit('connection_error', {
          server: validated.server,
          nick: validated.nick,
        });
        socket.emit('connection_removed', { connection: validated.server });
        socketClients.delete(validated.server);

        if (socket.data.username) {
          removeIrcClient(socket.data.username, validated.server);
        }
      });

      client.on('raw', (message: unknown) => {
        const rawMessage = message as Record<string, unknown>;
        socket.emit('raw', {
          rawCommand: rawMessage.rawCommand as string,
          command: rawMessage.command as string,
          commandType: rawMessage.commandType as string | undefined,
          args: rawMessage.args as string[],
          prefix: rawMessage.prefix as string | undefined,
          nick: rawMessage.nick as string | undefined,
          user: rawMessage.user as string | undefined,
          host: rawMessage.host as string | undefined,
          client_server: validated.server,
        });
      });

      socketClients.set(validated.server, client);

      if (socket.data.username) {
        addIrcClient(socket.data.username, validated.server, client);
      }
    });

    /**
     * Remove an IRC connection
     */
    socket.on('remove_connection', (data) => {
      const validated = validateSocketPayload(
        RemoveConnectionPayloadSchema,
        data
      );
      if (!validated) return;

      const client = socketClients.get(validated.connection);
      if (client) {
        client.disconnect();
        socketClients.delete(validated.connection);

        if (socket.data.username) {
          removeIrcClient(socket.data.username, validated.connection);
        }
      }

      socket.emit('connection_removed', { connection: validated.connection });
    });

    /**
     * Register a new user
     */
    socket.on('register', async (data) => {
      const validated = validateSocketPayload(
        RegisterPayloadSchema,
        data
      );
      if (!validated) return;

      const user = await createUser(validated);

      if (user) {
        socket.emit('register_success', { username: validated.username });
      } else {
        socket.emit('register_error', {
          message: `The username "${validated.username}" is taken, please try another username.`,
        });
      }
    });

    /**
     * Send a message to a channel/user
     */
    socket.on('say', (data) => {
      const validated = validateSocketPayload(
        SayPayloadSchema,
        data
      );
      if (!validated) return;

      const client = socketClients.get(validated.server);
      if (client) {
        client.say(validated.target, validated.text);

        // Echo the message back to the client (IRC doesn't echo your own messages)
        socket.emit('raw', {
          server: validated.server,
          from: client.nick,
          to: validated.target,
          text: validated.text,
          type: 'PRIVMSG',
          timestamp: Date.now(),
        });
      }
    });

    /**
     * Execute an IRC command
     */
    socket.on('command', (data) => {
      const validated = validateSocketPayload(
        CommandPayloadSchema,
        data
      );
      if (!validated) return;

      const client = socketClients.get(validated.server);
      if (!client) return;

      const args = validated.command ? validated.command.split(' ') : [''];
      const command = args[0].toLowerCase();

      switch (command) {
        case 'join':
          if (args[1]) client.join(args[1]);
          break;

        case 'leave':
        case 'part':
          client.part(validated.target, args.slice(1).join(' '));
          break;

        case 'me':
          client.action(validated.target, args.slice(1).join(' '));
          break;

        case 'msg':
          if (args[1]) {
            client.say(args[1], args.slice(2).join(' '));
          }
          break;

        case 'nick':
          if (args[1]) client.send('NICK', args[1]);
          break;

        case 'kick':
        case 'topic':
          // Include channel if not provided
          if (args[1] && !args[1].startsWith('#')) {
            args.splice(1, 0, validated.target);
          }
          client.send(...args);
          break;

        default:
          client.send(...args);
          break;
      }
    });

    /**
     * Send raw IRC command
     */
    socket.on('raw', (data) => {
      const validated = validateSocketPayload(
        RawPayloadSchema,
        data
      );
      if (!validated) return;

      const client = socketClients.get(validated.server);
      if (client) {
        client.send(...validated.args);
      }
    });

    /**
     * Set active server/channel
     */
    socket.on('set_active', (data) => {
      const validated = validateSocketPayload(
        SetActivePayloadSchema,
        data
      );
      if (!validated) return;

      if (socket.data.username) {
        const state = getIrcState(socket.data.username);
        if (state) {
          if (validated.active_server) {
            state.activeServer = validated.active_server;
          }
          if (validated.active_channel) {
            state.activeChannel = validated.active_channel;
          }
          setIrcState(socket.data.username, state);
        }
      }
    });

    /**
     * Clear notifications for a channel
     */
    socket.on('clearnotifications', (data) => {
      const validated = validateSocketPayload(
        ClearNotificationsPayloadSchema,
        data
      );
      if (!validated) return;

      // Notification clearing is handled client-side
      // This event is for persistence/sync if needed
    });

    /**
     * Close a channel
     */
    socket.on('closeChannel', (data) => {
      const validated = validateSocketPayload(
        CloseChannelPayloadSchema,
        data
      );
      if (!validated) return;

      // Channel state is managed client-side
      // This is for sync purposes
    });

    /**
     * Load message history
     */
    socket.on('loadHistory', async (data) => {
      const validated = validateSocketPayload(
        LoadHistoryPayloadSchema,
        data
      );
      if (!validated) return;

      if (!socket.data.userId) return;

      const messages = await loadHistory(
        socket.data.userId,
        validated.server,
        validated.channel,
        new Date(validated.timestamp)
      );

      socket.emit('history', {
        messages: messages.reverse().map((m) => ({
          id: m.id,
          from: m.from,
          text: m.text,
          type: m.type,
          timestamp: m.timestamp,
          attributes: m.attributes ? JSON.parse(m.attributes) as Record<string, unknown> : undefined,
        })),
        server: validated.server,
        channel: validated.channel,
      });
    });

    /**
     * Save user settings
     */
    socket.on('saveSettings', async (data) => {
      if (!socket.data.userId) return;

      await saveSettings(socket.data.userId, data as any);
    });

    /**
     * Add a plugin
     */
    socket.on('add_plugin', (data) => {
      const validated = validateSocketPayload(
        AddPluginPayloadSchema,
        data
      );
      if (!validated) return;

      // Plugin handling would go here
      socket.emit('plugin_added', { plugin: validated.plugin });
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { id: socket.id });

      // Save connection state if user is logged in
      if (socket.data.loggedIn && socket.data.userId) {
        const state = getIrcState(socket.data.username!);
        if (state) {
          await saveConnectionState(socket.data.userId, state);
        }
      }

      // Clean up socket-local IRC clients if not logged in
      if (!socket.data.loggedIn) {
        for (const client of socketClients.values()) {
          try {
            client.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        }
        socketClients.clear();
      }
    });
  });

  return io;
}

// Re-export closeAllConnections for shutdown handling
export { closeAllConnections } from './state.js';

export default initializeSocket;
