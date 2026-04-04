/**
 * TypeScript test setup and helper utilities
 * For testing the new modernized TypeScript codebase
 */

import chai from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global test configuration
global.expect = chai.expect;

// Path to compiled TypeScript code
export const DIST_PATH = path.join(__dirname, '../../dist');

/**
 * Helper to import compiled TypeScript modules
 * Falls back gracefully if not built yet
 */
export async function importTS(modulePath) {
  try {
    const fullPath = path.join(DIST_PATH, modulePath);
    return await import(fullPath);
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.warn(`Module not found: ${modulePath}. Run 'npm run build:server' first.`);
      return null;
    }
    throw error;
  }
}

/**
 * Create a mock Prisma client for testing
 */
export function createMockPrismaClient() {
  const users = new Map();
  const messages = new Map();
  const settings = new Map();
  const connections = new Map();

  let userIdCounter = 1;
  let messageIdCounter = 1;

  const client = {
    user: {
      create: async ({ data }) => {
        const id = String(userIdCounter++);
        const user = { id, ...data, createdAt: new Date() };
        users.set(id, user);
        return user;
      },
      findUnique: async ({ where }) => {
        if (where.id) return users.get(where.id) || null;
        if (where.username) {
          for (const user of users.values()) {
            if (user.username === where.username) return user;
          }
        }
        if (where.sessionId) {
          for (const user of users.values()) {
            if (user.sessionId === where.sessionId) return user;
          }
        }
        return null;
      },
      update: async ({ where, data }) => {
        const user = await client.user.findUnique({ where });
        if (!user) throw new Error('User not found');
        const updated = { ...user, ...data };
        users.set(user.id, updated);
        return updated;
      },
      delete: async ({ where }) => {
        const user = await client.user.findUnique({ where });
        if (user) users.delete(user.id);
        return user;
      },
    },
    message: {
      create: async ({ data }) => {
        const id = messageIdCounter++;
        const message = { id, ...data, timestamp: data.timestamp || new Date() };
        messages.set(id, message);
        return message;
      },
      findMany: async ({ where, orderBy, take }) => {
        let results = Array.from(messages.values());
        if (where) {
          if (where.server) results = results.filter(m => m.server === where.server);
          if (where.to) results = results.filter(m => m.to === where.to);
          if (where.userId) results = results.filter(m => m.userId === where.userId);
          if (where.timestamp?.lt) {
            results = results.filter(m => new Date(m.timestamp) < where.timestamp.lt);
          }
        }
        if (orderBy?.timestamp === 'desc') {
          results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        if (take) results = results.slice(0, take);
        return results;
      },
    },
    settings: {
      upsert: async ({ where, create, update }) => {
        const existing = settings.get(where.userId);
        if (existing) {
          const updated = { ...existing, ...update };
          settings.set(where.userId, updated);
          return updated;
        }
        const newSettings = { id: where.userId, ...create };
        settings.set(where.userId, newSettings);
        return newSettings;
      },
      findUnique: async ({ where }) => {
        return settings.get(where.userId) || null;
      },
    },
    connection: {
      upsert: async ({ where, create, update }) => {
        const existing = connections.get(where.userId);
        if (existing) {
          const updated = { ...existing, ...update };
          connections.set(where.userId, updated);
          return updated;
        }
        const newConn = { id: where.userId, ...create };
        connections.set(where.userId, newConn);
        return newConn;
      },
      findUnique: async ({ where }) => {
        return connections.get(where.userId) || null;
      },
      delete: async ({ where }) => {
        const conn = connections.get(where.userId);
        if (conn) connections.delete(where.userId);
        return conn;
      },
    },
    // Reset all data (for test cleanup)
    _reset: () => {
      users.clear();
      messages.clear();
      settings.clear();
      connections.clear();
      userIdCounter = 1;
      messageIdCounter = 1;
    },
    // Get raw data (for assertions)
    _getData: () => ({
      users: Array.from(users.values()),
      messages: Array.from(messages.values()),
      settings: Array.from(settings.values()),
      connections: Array.from(connections.values()),
    }),
  };

  return client;
}

/**
 * Create a mock Socket.IO socket for testing
 */
export function createMockTypedSocket(overrides = {}) {
  const events = new Map();
  const emitted = [];

  return {
    id: 'test-socket-' + Math.random().toString(36).substr(2, 9),
    data: {
      userId: null,
      username: null,
      loggedIn: false,
      ...overrides.data,
    },

    on(event, handler) {
      if (!events.has(event)) events.set(event, []);
      events.get(event).push(handler);
      return this;
    },

    emit(event, ...args) {
      emitted.push({ event, args });
      return true;
    },

    // Test helpers
    _trigger(event, ...args) {
      const handlers = events.get(event) || [];
      handlers.forEach(h => h(...args));
    },

    _getEmitted() {
      return emitted;
    },

    _getEmittedByEvent(event) {
      return emitted.filter(e => e.event === event);
    },

    _clearEmitted() {
      emitted.length = 0;
    },

    ...overrides,
  };
}

/**
 * Create a mock IRC client for testing
 */
export function createMockIRCClientTS(server = 'irc.test.net') {
  const events = new Map();
  const sentMessages = [];
  const joinedChannels = new Set();

  return {
    opt: {
      server,
      userName: 'testuser',
      nick: 'testnick',
    },
    nick: 'testnick',
    chans: {},

    on(event, handler) {
      if (!events.has(event)) events.set(event, []);
      events.get(event).push(handler);
      return this;
    },

    say(target, message) {
      sentMessages.push({ target, message, type: 'say' });
    },

    action(target, message) {
      sentMessages.push({ target, message, type: 'action' });
    },

    join(channel, callback) {
      joinedChannels.add(channel);
      this.chans[channel] = { users: {} };
      if (callback) callback();
    },

    part(channel, message, callback) {
      joinedChannels.delete(channel);
      delete this.chans[channel];
      if (callback) callback();
    },

    disconnect(message, callback) {
      joinedChannels.clear();
      this.chans = {};
      if (callback) callback();
    },

    send(...args) {
      sentMessages.push({ type: 'raw', args });
    },

    // Test helpers
    _trigger(event, ...args) {
      const handlers = events.get(event) || [];
      handlers.forEach(h => h(...args));
    },

    _getSentMessages() {
      return sentMessages;
    },

    _getJoinedChannels() {
      return Array.from(joinedChannels);
    },

    _clearSent() {
      sentMessages.length = 0;
    },
  };
}

/**
 * Wait for a condition with timeout
 */
export async function waitForCondition(conditionFn, options = {}) {
  const { timeout = 5000, interval = 10 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await conditionFn();
      if (result) return result;
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout after ${timeout}ms waiting for condition`);
}

/**
 * Create test user data
 */
export function createTestUserData(overrides = {}) {
  return {
    username: 'testuser_' + Math.random().toString(36).substr(2, 8),
    password: 'testpassword123',
    ...overrides,
  };
}

/**
 * Create test IRC message data
 */
export function createTestIrcMessage(overrides = {}) {
  return {
    rawCommand: 'PRIVMSG',
    command: 'PRIVMSG',
    args: ['#test', 'Hello, world!'],
    prefix: 'testuser!user@host',
    nick: 'testuser',
    user: 'user',
    host: 'host',
    client_server: 'irc.test.net',
    ...overrides,
  };
}
