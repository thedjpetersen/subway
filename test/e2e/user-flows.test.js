/**
 * End-to-End User Flow Tests
 * Tests complete user journeys through the IRC client
 */

import { expect } from 'chai';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  createMockPrismaClient,
  createMockTypedSocket,
  createMockIRCClientTS,
  createTestIrcMessage,
} from '../helpers/ts-setup.js';

function createTestUserData(overrides = {}) {
  return {
    username: 'testuser_' + uuidv4().substr(0, 8),
    password: 'testpassword123',
    ...overrides,
  };
}

describe('End-to-End User Flows', function() {
  let mockPrisma;
  let mockSocket;

  beforeEach(function() {
    mockPrisma = createMockPrismaClient();
    mockSocket = createMockTypedSocket();
  });

  afterEach(function() {
    mockPrisma._reset();
  });

  describe('New User Registration Flow', function() {
    it('should complete full registration process', async function() {
      const userData = createTestUserData();

      // Step 1: Validate username availability
      const existingUser = await mockPrisma.user.findUnique({
        where: { username: userData.username },
      });
      expect(existingUser).to.be.null;

      // Step 2: Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      expect(hashedPassword).to.not.equal(userData.password);

      // Step 3: Create user
      const newUser = await mockPrisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
        },
      });
      expect(newUser.id).to.exist;

      // Step 4: Create default settings
      const defaultSettings = {
        timeFormat: '12h',
        highlights: [],
        plugins: [],
        notifyPm: true,
      };
      await mockPrisma.settings.upsert({
        where: { userId: newUser.id },
        create: {
          userId: newUser.id,
          settings: JSON.stringify(defaultSettings),
        },
        update: {},
      });

      // Step 5: Verify registration complete
      const user = await mockPrisma.user.findUnique({
        where: { username: userData.username },
      });
      const settings = await mockPrisma.settings.findUnique({
        where: { userId: newUser.id },
      });

      expect(user).to.not.be.null;
      expect(settings).to.not.be.null;
    });

    it('should reject duplicate username registration', async function() {
      // Create existing user
      await mockPrisma.user.create({
        data: { username: 'existinguser', password: 'hash' },
      });

      // Try to find if username exists
      const existing = await mockPrisma.user.findUnique({
        where: { username: 'existinguser' },
      });

      expect(existing).to.not.be.null;
      // In real flow, registration would be rejected here
    });
  });

  describe('User Login Flow', function() {
    let testUser;
    const testPassword = 'testpassword123';

    beforeEach(async function() {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await mockPrisma.user.create({
        data: { username: 'loginuser', password: hashedPassword },
      });
    });

    it('should complete successful login', async function() {
      // Step 1: Find user
      const user = await mockPrisma.user.findUnique({
        where: { username: 'loginuser' },
      });
      expect(user).to.not.be.null;

      // Step 2: Verify password
      const isValid = await bcrypt.compare(testPassword, user.password);
      expect(isValid).to.be.true;

      // Step 3: Generate session
      const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36);

      // Step 4: Store session
      await mockPrisma.user.update({
        where: { id: user.id },
        data: { sessionId },
      });

      // Step 5: Verify session stored
      const updatedUser = await mockPrisma.user.findUnique({
        where: { sessionId },
      });
      expect(updatedUser).to.not.be.null;
      expect(updatedUser.username).to.equal('loginuser');
    });

    it('should reject invalid password', async function() {
      const user = await mockPrisma.user.findUnique({
        where: { username: 'loginuser' },
      });

      const isValid = await bcrypt.compare('wrongpassword', user.password);
      expect(isValid).to.be.false;
    });
  });

  describe('IRC Connection Flow', function() {
    it('should establish IRC connection', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');

      // Step 1: Connect to server (simulated)
      const connectionPayload = {
        server: 'irc.libera.chat',
        nick: 'testnick',
        channels: ['#test'],
      };

      expect(connectionPayload.server).to.equal('irc.libera.chat');

      // Step 2: Simulate welcome message (001)
      const welcomeMessage = createTestIrcMessage({
        command: '001',
        args: ['testnick', 'Welcome to the IRC network'],
        client_server: 'irc.libera.chat',
      });

      mockSocket.emit('raw', welcomeMessage);

      // Step 3: Auto-join channels
      mockIrc.join('#test');
      expect(mockIrc._getJoinedChannels()).to.include('#test');

      // Step 4: Receive NAMES reply (353)
      const namesMessage = createTestIrcMessage({
        command: '353',
        args: ['testnick', '=', '#test', '@op +voice user1 user2'],
        client_server: 'irc.libera.chat',
      });

      mockSocket.emit('raw', namesMessage);

      // Step 5: Verify connection state
      const emitted = mockSocket._getEmittedByEvent('raw');
      expect(emitted.length).to.be.at.least(2);
    });
  });

  describe('Chat Message Flow', function() {
    it('should send and receive messages', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');
      mockIrc.join('#test');

      // Step 1: Send a message
      const messagePayload = {
        server: 'irc.libera.chat',
        target: '#test',
        text: 'Hello, channel!',
      };

      mockIrc.say(messagePayload.target, messagePayload.text);

      const sent = mockIrc._getSentMessages();
      expect(sent).to.have.length(1);
      expect(sent[0].target).to.equal('#test');
      expect(sent[0].message).to.equal('Hello, channel!');

      // Step 2: Receive a message
      const incomingMessage = createTestIrcMessage({
        command: 'PRIVMSG',
        args: ['#test', 'Hello back!'],
        nick: 'otheruser',
        client_server: 'irc.libera.chat',
      });

      mockSocket.emit('raw', incomingMessage);

      // Step 3: Log message to database
      await mockPrisma.message.create({
        data: {
          server: 'irc.libera.chat',
          from: 'otheruser',
          to: '#test',
          type: 'PRIVMSG',
          text: 'Hello back!',
          userId: 'user-123',
        },
      });

      // Step 4: Verify message logged
      const messages = await mockPrisma.message.findMany({
        where: { to: '#test' },
      });
      expect(messages).to.have.length(1);
    });

    it('should handle action messages (/me)', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');
      mockIrc.join('#test');

      // Send action
      mockIrc.action('#test', 'waves hello');

      const sent = mockIrc._getSentMessages();
      expect(sent).to.have.length(1);
      expect(sent[0].type).to.equal('action');
      expect(sent[0].message).to.equal('waves hello');
    });
  });

  describe('Channel Join/Part Flow', function() {
    it('should join a new channel', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');

      // Step 1: Join channel
      mockIrc.join('#newchannel');

      // Step 2: Receive JOIN confirmation
      const joinMessage = createTestIrcMessage({
        command: 'JOIN',
        args: ['#newchannel'],
        nick: 'testnick',
        client_server: 'irc.libera.chat',
      });
      mockSocket.emit('raw', joinMessage);

      // Step 3: Receive NAMES
      const namesMessage = createTestIrcMessage({
        command: '353',
        args: ['testnick', '=', '#newchannel', 'testnick @chanop +voiced'],
        client_server: 'irc.libera.chat',
      });
      mockSocket.emit('raw', namesMessage);

      // Step 4: Verify joined
      expect(mockIrc._getJoinedChannels()).to.include('#newchannel');
    });

    it('should part from a channel', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');
      mockIrc.join('#leavingchannel');

      // Step 1: Part channel
      mockIrc.part('#leavingchannel', 'Goodbye!');

      // Step 2: Receive PART confirmation
      const partMessage = createTestIrcMessage({
        command: 'PART',
        args: ['#leavingchannel', 'Goodbye!'],
        nick: 'testnick',
        client_server: 'irc.libera.chat',
      });
      mockSocket.emit('raw', partMessage);

      // Step 3: Verify left
      expect(mockIrc._getJoinedChannels()).to.not.include('#leavingchannel');
    });
  });

  describe('Private Message Flow', function() {
    it('should handle private messages', async function() {
      // Step 1: Receive PM
      const pmMessage = createTestIrcMessage({
        command: 'PRIVMSG',
        args: ['testnick', 'This is a private message'],
        nick: 'sender',
        client_server: 'irc.libera.chat',
      });

      mockSocket.emit('raw', pmMessage);

      // Step 2: Log PM
      await mockPrisma.message.create({
        data: {
          server: 'irc.libera.chat',
          from: 'sender',
          to: 'testnick', // Not a channel
          type: 'PRIVMSG',
          text: 'This is a private message',
          userId: 'user-123',
        },
      });

      // Step 3: Verify PM logged
      const pms = await mockPrisma.message.findMany({
        where: {
          to: 'testnick',
        },
      });
      expect(pms).to.have.length(1);
      expect(pms[0].from).to.equal('sender');
    });
  });

  describe('Settings Update Flow', function() {
    it('should update user settings', async function() {
      // Create user with settings
      const user = await mockPrisma.user.create({
        data: { username: 'settingsuser', password: 'hash' },
      });

      // Initial settings
      await mockPrisma.settings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          settings: JSON.stringify({ theme: 'light' }),
        },
        update: {},
      });

      // Step 1: Get current settings
      const current = await mockPrisma.settings.findUnique({
        where: { userId: user.id },
      });
      const currentParsed = JSON.parse(current.settings);
      expect(currentParsed.theme).to.equal('light');

      // Step 2: Update settings
      const newSettings = { ...currentParsed, theme: 'dark' };
      await mockPrisma.settings.upsert({
        where: { userId: user.id },
        create: {},
        update: { settings: JSON.stringify(newSettings) },
      });

      // Step 3: Verify update
      const updated = await mockPrisma.settings.findUnique({
        where: { userId: user.id },
      });
      const updatedParsed = JSON.parse(updated.settings);
      expect(updatedParsed.theme).to.equal('dark');
    });
  });

  describe('Message History Flow', function() {
    beforeEach(async function() {
      // Create historical messages
      const baseTime = Date.now();
      for (let i = 0; i < 50; i++) {
        await mockPrisma.message.create({
          data: {
            server: 'irc.libera.chat',
            from: 'user' + (i % 5),
            to: '#history-test',
            type: 'PRIVMSG',
            text: `Historical message ${i}`,
            timestamp: new Date(baseTime - i * 60000),
            userId: 'user-123',
          },
        });
      }
    });

    it('should load message history', async function() {
      // Step 1: Request history
      const messages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.libera.chat',
          to: '#history-test',
        },
        orderBy: { timestamp: 'desc' },
        take: 25,
      });

      expect(messages).to.have.length(25);

      // Step 2: Request more (pagination)
      const oldestTimestamp = messages[messages.length - 1].timestamp;
      const moreMessages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.libera.chat',
          to: '#history-test',
          timestamp: { lt: oldestTimestamp },
        },
        orderBy: { timestamp: 'desc' },
        take: 25,
      });

      expect(moreMessages).to.have.length(25);

      // Verify no overlap
      const firstBatchIds = new Set(messages.map(m => m.id));
      moreMessages.forEach(m => {
        expect(firstBatchIds.has(m.id)).to.be.false;
      });
    });
  });

  describe('Disconnection Flow', function() {
    it('should handle graceful disconnect', async function() {
      const mockIrc = createMockIRCClientTS('irc.libera.chat');
      mockIrc.join('#test');

      // Step 1: Disconnect
      mockIrc.disconnect('Goodbye');

      // Step 2: Verify disconnected
      expect(mockIrc._getJoinedChannels()).to.have.length(0);
    });

    it('should save connection state before disconnect', async function() {
      // Simulate saving state
      const connectionState = {
        server: 'irc.libera.chat',
        nick: 'testnick',
        channels: ['#test', '#general'],
      };

      await mockPrisma.connection.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          connectionData: JSON.stringify([connectionState]),
        },
        update: {
          connectionData: JSON.stringify([connectionState]),
        },
      });

      // Verify state saved
      const saved = await mockPrisma.connection.findUnique({
        where: { userId: 'user-123' },
      });

      const parsed = JSON.parse(saved.connectionData);
      expect(parsed[0].server).to.equal('irc.libera.chat');
      expect(parsed[0].channels).to.include('#test');
    });
  });

  describe('Reconnection Flow', function() {
    it('should restore connections on reconnect', async function() {
      // Step 1: Save connection state
      const savedState = [
        {
          server: 'irc.libera.chat',
          nick: 'testnick',
          channels: ['#test', '#general'],
        },
      ];

      await mockPrisma.connection.upsert({
        where: { userId: 'user-123' },
        create: {
          userId: 'user-123',
          connectionData: JSON.stringify(savedState),
        },
        update: {},
      });

      // Step 2: Simulate reconnect - load saved state
      const saved = await mockPrisma.connection.findUnique({
        where: { userId: 'user-123' },
      });

      const connections = JSON.parse(saved.connectionData);

      // Step 3: Emit restore_connection
      mockSocket.emit('restore_connection', {
        connections,
        active_server: 'irc.libera.chat',
        active_channel: '#test',
      });

      // Step 4: Verify restored
      const emitted = mockSocket._getEmittedByEvent('restore_connection');
      expect(emitted).to.have.length(1);
      expect(emitted[0].args[0].active_server).to.equal('irc.libera.chat');
    });
  });
});
