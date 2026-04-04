/**
 * Socket.IO hook
 * Manages the Socket.IO connection and provides typed event emitters
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ConnectIrcPayload,
  CommandPayload,
} from '@shared/types/socket.types';
import type { IrcConnection, IrcChannel } from '@shared/types/irc.types';
import { useAppStore } from '../stores/useAppStore';
import { useIrcHandler } from './useIrcHandler';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handleIrcMessage = useIrcHandler();

  const {
    restoreState,
    setInitialized,
    removeServer,
  } = useAppStore();

  // Initialize socket connection
  useEffect(() => {
    if (globalSocket) {
      socketRef.current = globalSocket;
      setIsConnected(globalSocket.connected);
      return;
    }

    const socket: TypedSocket = io({
      transports: ['websocket', 'polling'],
    });

    globalSocket = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // Handle raw IRC messages
    socket.on('raw', (message) => {
      handleIrcMessage(message);
    });

    // Handle connection restoration
    socket.on('restore_connection', (data) => {
      console.log('Restoring connection:', data);
      const restoredConnections: Record<string, IrcConnection> = {};

      for (const conn of data.connections) {
        const restoredChannels: Record<string, IrcChannel> = {};

        for (const [chName, ch] of Object.entries(conn.channels)) {
          restoredChannels[chName] = {
            ...ch,
            messages: ch.messages.map((m, i) => ({
              id: `restored-${i}`,
              type: m.type,
              from: m.from,
              text: m.text,
              timestamp: m.timestamp,
            })),
            highlights: {},
            history: [],
            historyOffset: 0,
            fetched: false,
            allFetched: false,
            unread: 0,
          };
        }

        restoredConnections[conn.name] = {
          ...conn,
          channels: restoredChannels,
          channelList: conn.channelList || [],
        };
      }

      restoreState({
        connections: restoredConnections,
        activeServer: data.active_server || null,
        activeChannel: data.active_channel || null,
      });
      setInitialized(true);
    });

    // Handle connection errors
    socket.on('connection_error', (data) => {
      console.error('Connection error:', data);
    });

    // Handle connection removal
    socket.on('connection_removed', (data) => {
      removeServer(data.connection);
    });

    // Handle registration success
    socket.on('register_success', (data) => {
      console.log('Registration successful:', data.username);
    });

    // Handle registration error
    socket.on('register_error', (data) => {
      console.error('Registration error:', data.message);
    });

    // Handle history
    socket.on('history', (data) => {
      const store = useAppStore.getState();
      store.prependMessages(
        data.server,
        data.channel,
        data.messages.map((m) => ({
          id: `history-${m.id}`,
          type: m.type as any,
          from: m.from,
          text: m.text || '',
          timestamp: new Date(m.timestamp).getTime(),
        }))
      );
      store.markHistoryFetched(
        data.server,
        data.channel,
        data.messages.length < 25
      );
    });

    return () => {
      // Don't disconnect on unmount - we want to keep the connection
    };
  }, [handleIrcMessage, restoreState, setInitialized, removeServer]);

  // Connect to IRC server
  const connectIrc = useCallback((data: ConnectIrcPayload) => {
    socketRef.current?.emit('connectirc', data);
  }, []);

  // Send a message
  const say = useCallback((target: string, text: string) => {
    const server = useAppStore.getState().activeServer;
    if (!server) return;
    socketRef.current?.emit('say', { server, target, text });
  }, []);

  // Send a command
  const command = useCallback((data: CommandPayload) => {
    socketRef.current?.emit('command', data);
  }, []);

  // Send a command (simplified interface)
  const sendCommand = useCallback((cmd: string, args: string) => {
    const server = useAppStore.getState().activeServer;
    if (!server) return;
    socketRef.current?.emit('command', { server, target: args.split(' ')[0] || '', command: `${cmd} ${args}` });
  }, []);

  // Send raw IRC command
  const sendRaw = useCallback((raw: string) => {
    const server = useAppStore.getState().activeServer;
    if (!server) return;
    socketRef.current?.emit('raw', { server, args: raw.split(' ') });
  }, []);

  // Disconnect from a server
  const disconnectServer = useCallback((connection: string) => {
    socketRef.current?.emit('remove_connection', { connection });
  }, []);

  // Register a new user
  const register = useCallback((username: string, password: string) => {
    socketRef.current?.emit('register', { username, password });
  }, []);

  // Load message history
  const loadHistory = useCallback(
    (server: string, channel: string, timestamp: number) => {
      socketRef.current?.emit('loadHistory', { server, channel, timestamp });
    },
    []
  );

  // Save settings
  const saveSettings = useCallback((settings: any) => {
    socketRef.current?.emit('saveSettings', settings);
  }, []);

  // Set active server/channel
  const setActive = useCallback(
    (activeServer?: string, activeChannel?: string) => {
      socketRef.current?.emit('set_active', {
        active_server: activeServer,
        active_channel: activeChannel,
      });
    },
    []
  );

  // Clear notifications
  const clearNotifications = useCallback(
    (server: { name: string }, channel: string) => {
      socketRef.current?.emit('clearnotifications', { server, channel });
    },
    []
  );

  // Get socket ID
  const getSocketId = useCallback(() => {
    return socketRef.current?.id;
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    connectIrc,
    say,
    command,
    sendCommand,
    sendRaw,
    disconnectServer,
    register,
    loadHistory,
    saveSettings,
    setActive,
    clearNotifications,
    getSocketId,
  };
}
