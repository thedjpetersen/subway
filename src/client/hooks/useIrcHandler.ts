/**
 * IRC message handler hook
 * Processes incoming IRC messages and updates the store
 * Port of src/js/handle_irc.js to React/TypeScript
 */

import { useCallback } from 'react';
import type { RawIrcMessage } from '@shared/types/socket.types';
import type { IrcMessage, IrcUser } from '@shared/types/irc.types';
import { useAppStore } from '../stores/useAppStore';

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

function parseNickFromPrefix(nick: string): { nick: string; type: '@' | '+' | '' } {
  if (nick.startsWith('@')) {
    return { nick: nick.slice(1), type: '@' };
  }
  if (nick.startsWith('+')) {
    return { nick: nick.slice(1), type: '+' };
  }
  return { nick, type: '' };
}

export function useIrcHandler() {
  const store = useAppStore();

  const handleMessage = useCallback((message: RawIrcMessage) => {
    const serverName = message.client_server;
    const { rawCommand, args, nick } = message;

    // Don't process PING messages
    if (rawCommand === 'PING') {
      return;
    }

    // Debug logging (except for PING)
    if (rawCommand !== 'PING') {
      console.log('IRC:', message);
    }

    switch (rawCommand) {
      case 'NOTICE': {
        // If not initialized, this is the first connection
        if (!store.initialized && serverName) {
          store.setInitialized(true);
          store.addServer(serverName);
          store.addChannel(serverName, 'status');
          store.setActiveServer(serverName);
          store.setActiveChannel('status');
        } else if (!store.connections[serverName]) {
          store.addServer(serverName);
          store.addChannel(serverName, 'status');
          store.setActiveServer(serverName);
          store.setActiveChannel('status');
        }

        store.addMessage(serverName, 'status', {
          id: generateMessageId(),
          type: 'NOTICE',
          from: '',
          text: args[1] || '',
          timestamp: Date.now(),
        });
        break;
      }

      case 'PRIVMSG': {
        const target = args[0];
        const text = args[1] || '';
        const isChannel = target.startsWith('#');

        // Handle ACTION messages
        let messageType: IrcMessage['type'] = 'PRIVMSG';
        let messageText = text;
        if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
          messageType = 'ACTION';
          messageText = text.slice(8, -1);
        }

        const channelName = isChannel ? target : nick || '';
        store.addMessage(serverName, channelName, {
          id: generateMessageId(),
          type: messageType,
          from: nick || '',
          text: messageText,
          timestamp: Date.now(),
        });
        break;
      }

      case 'JOIN': {
        const channelName = args[0];
        const currentNick = store.connections[serverName]?.nick;

        if (nick === currentNick) {
          // We joined a channel
          store.addChannel(serverName, channelName);
          store.setActiveChannel(channelName);
        } else {
          // Someone else joined
          store.addMessage(serverName, channelName, {
            id: generateMessageId(),
            type: 'JOIN',
            from: nick || '',
            text: '',
            timestamp: Date.now(),
            nick: nick,
          });
          store.addUser(serverName, channelName, {
            nick: nick || '',
            type: '',
            updated: Date.now(),
          });
        }
        break;
      }

      case 'PART': {
        const channelName = args[0];
        const reason = args[1] || '';
        const currentNick = store.connections[serverName]?.nick;

        if (nick === currentNick) {
          // We left a channel
          store.removeChannel(serverName, channelName);
          store.setActiveChannel('status');
        } else {
          // Someone else left
          store.addMessage(serverName, channelName, {
            id: generateMessageId(),
            type: 'PART',
            from: nick || '',
            text: reason,
            timestamp: Date.now(),
            nick: nick,
          });
          store.removeUser(serverName, channelName, nick || '');
        }
        break;
      }

      case 'QUIT': {
        const reason = args[0] || '';
        const server = store.connections[serverName];

        if (server) {
          // Remove user from all channels they were in
          for (const channelName of Object.keys(server.channels)) {
            const channel = server.channels[channelName];
            if (channel.users.some((u) => u.nick === nick)) {
              store.addMessage(serverName, channelName, {
                id: generateMessageId(),
                type: 'QUIT',
                from: nick || '',
                text: reason,
                timestamp: Date.now(),
                nick: nick,
              });
              store.removeUser(serverName, channelName, nick || '');
            }
          }
        }
        break;
      }

      case 'KICK': {
        const channelName = args[0];
        const kickedNick = args[1];
        const reason = args[2] || '';
        const currentNick = store.connections[serverName]?.nick;

        if (kickedNick === currentNick) {
          // We were kicked
          store.removeChannel(serverName, channelName);
          store.setActiveChannel('status');
          store.addMessage(serverName, 'status', {
            id: generateMessageId(),
            type: 'KICK',
            from: nick || '',
            text: kickedNick,
            timestamp: Date.now(),
            nick: nick,
            reason: reason,
          });
        } else {
          // Someone else was kicked
          store.addMessage(serverName, channelName, {
            id: generateMessageId(),
            type: 'KICK',
            from: nick || '',
            text: kickedNick,
            timestamp: Date.now(),
            nick: nick,
            reason: reason,
          });
          store.removeUser(serverName, channelName, kickedNick);
        }
        break;
      }

      case 'NICK': {
        const newNick = args[0];
        const currentNick = store.connections[serverName]?.nick;

        if (nick === currentNick) {
          // Our nick changed
          store.updateServerNick(serverName, newNick);
          store.addMessage(serverName, 'status', {
            id: generateMessageId(),
            type: 'NICK',
            from: nick || '',
            text: newNick,
            timestamp: Date.now(),
            nick: nick,
          });
        }

        // Update nick in all channels
        store.updateUserNick(serverName, nick || '', newNick);
        break;
      }

      case 'MODE': {
        const target = args[0];
        const isChannel = target.startsWith('#');

        if (isChannel) {
          const mode = args[1];
          const modeTarget = args[2];

          store.addMessage(serverName, target, {
            id: generateMessageId(),
            type: 'MODE',
            from: nick || '',
            text: modeTarget || '',
            timestamp: Date.now(),
            mode: mode,
          });

          // Update user mode
          if (modeTarget && (mode === '+o' || mode === '-o')) {
            store.updateUserMode(
              serverName,
              target,
              modeTarget,
              mode === '+o' ? '@' : ''
            );
          }
        }
        break;
      }

      case 'TOPIC': {
        const channelName = args[0];
        const topic = args[1] || '';

        store.addMessage(serverName, channelName, {
          id: generateMessageId(),
          type: 'TOPIC',
          from: nick || '',
          text: topic,
          timestamp: Date.now(),
          nick: nick,
        });
        store.setChannelTopic(serverName, channelName, topic);
        break;
      }

      // Numeric responses
      case '001': {
        // Welcome message - set nick
        store.updateServerNick(serverName, args[0]);
        store.addMessage(serverName, 'status', {
          id: generateMessageId(),
          type: 'NOTICE',
          from: '',
          text: args[1] || '',
          timestamp: Date.now(),
        });
        break;
      }

      case '002':
      case '003': {
        store.addMessage(serverName, 'status', {
          id: generateMessageId(),
          type: 'NOTICE',
          from: '',
          text: args.slice(1).join(' '),
          timestamp: Date.now(),
        });
        break;
      }

      case '332': {
        // Topic reply
        const channelName = args[1];
        const topic = args[2] || '';
        store.setChannelTopic(serverName, channelName, topic);
        break;
      }

      case '353': {
        // Names list
        const channelName = args[2];
        const nicks = args[3].trim().split(' ');
        const users: IrcUser[] = nicks.map((n) => {
          const { nick: parsedNick, type } = parseNickFromPrefix(n);
          return {
            nick: parsedNick,
            type,
            updated: Date.now(),
          };
        });
        store.addUser(serverName, channelName, users);
        break;
      }

      case '372': {
        // MOTD line
        const server = store.connections[serverName];
        if (server) {
          const currentMotd = server.motd || '';
          store.setServerMotd(serverName, currentMotd + '\n' + args[1]);
        }
        break;
      }

      case '375': {
        // MOTD start
        store.setServerMotd(serverName, args[1] || '');
        break;
      }

      case '376': {
        // MOTD end
        const server = store.connections[serverName];
        if (server?.motd) {
          store.addMessage(serverName, 'status', {
            id: generateMessageId(),
            type: 'NOTICE',
            from: '',
            text: server.motd,
            timestamp: Date.now(),
            specialType: 'MOTD',
          });
        }
        break;
      }

      case '433': {
        // Nickname already in use
        store.addMessage(serverName, 'status', {
          id: generateMessageId(),
          type: 'NOTICE',
          from: '',
          text: 'Error: ' + args.join(' '),
          timestamp: Date.now(),
        });
        break;
      }

      default: {
        // Generic handler for IRC errors
        if (message.commandType === 'irc_error') {
          store.addMessage(serverName, 'status', {
            id: generateMessageId(),
            type: 'NOTICE',
            from: '',
            text: args.join(' - '),
            timestamp: Date.now(),
          });
        }
        break;
      }
    }
  }, [store]);

  return handleMessage;
}
