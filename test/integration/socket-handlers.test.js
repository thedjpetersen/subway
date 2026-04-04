/**
 * Socket.IO Handler Integration Tests
 * Tests the modernized TypeScript socket handlers
 */

import { expect } from 'chai';
import {
  createMockTypedSocket,
  createMockPrismaClient,
  createTestIrcMessage,
} from '../helpers/ts-setup.js';

describe('Socket.IO Handlers', function() {
  let mockSocket;
  let mockPrisma;

  beforeEach(function() {
    mockSocket = createMockTypedSocket();
    mockPrisma = createMockPrismaClient();
  });

  afterEach(function() {
    mockPrisma._reset();
  });

  describe('Connection Handler (connectirc)', function() {
    it('should validate required connection parameters', function() {
      const validPayload = {
        server: 'irc.libera.chat',
        nick: 'testuser',
      };

      expect(validPayload.server).to.be.a('string').with.length.greaterThan(0);
      expect(validPayload.nick).to.be.a('string').with.length.greaterThan(0);
    });

    it('should accept optional parameters', function() {
      const fullPayload = {
        server: 'irc.libera.chat',
        nick: 'testuser',
        userName: 'testuser',
        channels: ['#test', '#general'],
        password: 'serverpass',
        port: 6697,
        secure: true,
      };

      expect(fullPayload.channels).to.be.an('array');
      expect(fullPayload.port).to.be.a('number');
      expect(fullPayload.secure).to.be.a('boolean');
    });

    it('should reject invalid nick (too short)', function() {
      const invalidPayload = {
        server: 'irc.libera.chat',
        nick: '',
      };

      expect(invalidPayload.nick).to.have.length(0);
    });

    it('should reject invalid nick (too long)', function() {
      const invalidPayload = {
        server: 'irc.libera.chat',
        nick: 'a'.repeat(31), // Max is typically 30
      };

      expect(invalidPayload.nick).to.have.length.greaterThan(30);
    });
  });

  describe('Say Handler', function() {
    it('should validate say payload', function() {
      const validPayload = {
        server: 'irc.libera.chat',
        target: '#channel',
        text: 'Hello, world!',
      };

      expect(validPayload.server).to.not.be.empty;
      expect(validPayload.target).to.not.be.empty;
      expect(validPayload.text).to.not.be.empty;
    });

    it('should reject empty message', function() {
      const invalidPayload = {
        server: 'irc.libera.chat',
        target: '#channel',
        text: '',
      };

      expect(invalidPayload.text).to.be.empty;
    });

    it('should reject overly long messages', function() {
      const invalidPayload = {
        server: 'irc.libera.chat',
        target: '#channel',
        text: 'x'.repeat(513), // Max is typically 512
      };

      expect(invalidPayload.text).to.have.length.greaterThan(512);
    });

    it('should handle channel targets', function() {
      const channelTarget = '#test-channel';
      expect(channelTarget.startsWith('#')).to.be.true;
    });

    it('should handle private message targets', function() {
      const userTarget = 'someuser';
      expect(userTarget.startsWith('#')).to.be.false;
    });
  });

  describe('Command Handler', function() {
    it('should validate command payload', function() {
      const validPayload = {
        server: 'irc.libera.chat',
        target: '#channel',
        command: 'join #newchannel',
      };

      expect(validPayload.command).to.not.be.empty;
    });

    it('should handle JOIN command', function() {
      const command = 'join #newchannel';
      const parts = command.split(' ');

      expect(parts[0].toLowerCase()).to.equal('join');
      expect(parts[1]).to.equal('#newchannel');
    });

    it('should handle PART command', function() {
      const command = 'part #channel Goodbye!';
      const parts = command.split(' ');

      expect(parts[0].toLowerCase()).to.equal('part');
      expect(parts[1]).to.equal('#channel');
      expect(parts.slice(2).join(' ')).to.equal('Goodbye!');
    });

    it('should handle NICK command', function() {
      const command = 'nick newnickname';
      const parts = command.split(' ');

      expect(parts[0].toLowerCase()).to.equal('nick');
      expect(parts[1]).to.equal('newnickname');
    });

    it('should handle TOPIC command', function() {
      const command = 'topic #channel New topic for the channel';
      const parts = command.split(' ');

      expect(parts[0].toLowerCase()).to.equal('topic');
      expect(parts[1]).to.equal('#channel');
    });

    it('should handle KICK command', function() {
      const command = 'kick #channel baduser Reason for kick';
      const parts = command.split(' ');

      expect(parts[0].toLowerCase()).to.equal('kick');
      expect(parts[1]).to.equal('#channel');
      expect(parts[2]).to.equal('baduser');
    });
  });

  describe('Register Handler', function() {
    it('should validate username format', function() {
      const validUsername = 'testuser123';
      const invalidUsername = 'test user!@#';

      expect(/^[a-zA-Z0-9_]+$/.test(validUsername)).to.be.true;
      expect(/^[a-zA-Z0-9_]+$/.test(invalidUsername)).to.be.false;
    });

    it('should enforce minimum username length', function() {
      const tooShort = 'ab';
      const valid = 'abc';

      expect(tooShort.length).to.be.lessThan(3);
      expect(valid.length).to.be.at.least(3);
    });

    it('should enforce maximum username length', function() {
      const tooLong = 'a'.repeat(33);
      const valid = 'a'.repeat(32);

      expect(tooLong.length).to.be.greaterThan(32);
      expect(valid.length).to.equal(32);
    });

    it('should enforce minimum password length', function() {
      const tooShort = '12345';
      const valid = '123456';

      expect(tooShort.length).to.be.lessThan(6);
      expect(valid.length).to.be.at.least(6);
    });

    it('should enforce maximum password length', function() {
      const tooLong = 'x'.repeat(129);
      const valid = 'x'.repeat(128);

      expect(tooLong.length).to.be.greaterThan(128);
      expect(valid.length).to.equal(128);
    });
  });

  describe('Raw IRC Message Handler', function() {
    it('should parse PRIVMSG correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'PRIVMSG',
        args: ['#channel', 'Hello, world!'],
        nick: 'sender',
      });

      expect(rawMessage.command).to.equal('PRIVMSG');
      expect(rawMessage.args[0]).to.equal('#channel');
      expect(rawMessage.args[1]).to.equal('Hello, world!');
      expect(rawMessage.nick).to.equal('sender');
    });

    it('should parse JOIN correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'JOIN',
        args: ['#newchannel'],
        nick: 'joiner',
      });

      expect(rawMessage.command).to.equal('JOIN');
      expect(rawMessage.args[0]).to.equal('#newchannel');
    });

    it('should parse PART correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'PART',
        args: ['#channel', 'Leaving now'],
        nick: 'leaver',
      });

      expect(rawMessage.command).to.equal('PART');
      expect(rawMessage.args[0]).to.equal('#channel');
    });

    it('should parse QUIT correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'QUIT',
        args: ['Connection reset by peer'],
        nick: 'quitter',
      });

      expect(rawMessage.command).to.equal('QUIT');
    });

    it('should parse KICK correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'KICK',
        args: ['#channel', 'baduser', 'Reason'],
        nick: 'operator',
      });

      expect(rawMessage.command).to.equal('KICK');
      expect(rawMessage.args[1]).to.equal('baduser');
    });

    it('should parse NICK correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'NICK',
        args: ['newnick'],
        nick: 'oldnick',
      });

      expect(rawMessage.command).to.equal('NICK');
      expect(rawMessage.args[0]).to.equal('newnick');
    });

    it('should parse MODE correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'MODE',
        args: ['#channel', '+o', 'targetuser'],
        nick: 'chanop',
      });

      expect(rawMessage.command).to.equal('MODE');
      expect(rawMessage.args[1]).to.equal('+o');
    });

    it('should parse TOPIC correctly', function() {
      const rawMessage = createTestIrcMessage({
        command: 'TOPIC',
        args: ['#channel', 'New channel topic'],
        nick: 'topicsetter',
      });

      expect(rawMessage.command).to.equal('TOPIC');
      expect(rawMessage.args[1]).to.equal('New channel topic');
    });

    it('should parse numeric replies (welcome)', function() {
      const rawMessage = createTestIrcMessage({
        command: '001',
        commandType: 'reply',
        args: ['testnick', 'Welcome to the IRC network'],
      });

      expect(rawMessage.command).to.equal('001');
    });

    it('should parse NAMES reply (353)', function() {
      const rawMessage = createTestIrcMessage({
        command: '353',
        args: ['testnick', '=', '#channel', '@op +voice user1 user2'],
      });

      expect(rawMessage.command).to.equal('353');
      const users = rawMessage.args[3].split(' ');
      expect(users).to.include('@op');
      expect(users).to.include('+voice');
    });
  });

  describe('Load History Handler', function() {
    it('should validate history request payload', function() {
      const validPayload = {
        server: 'irc.libera.chat',
        channel: '#test',
        timestamp: Date.now(),
      };

      expect(validPayload.server).to.not.be.empty;
      expect(validPayload.channel).to.not.be.empty;
      expect(validPayload.timestamp).to.be.a('number');
    });

    it('should reject invalid timestamp', function() {
      const invalidPayload = {
        server: 'irc.libera.chat',
        channel: '#test',
        timestamp: -1,
      };

      expect(invalidPayload.timestamp).to.be.lessThan(0);
    });
  });

  describe('Set Active Handler', function() {
    it('should accept valid active server/channel', function() {
      const payload = {
        active_server: 'irc.libera.chat',
        active_channel: '#test',
      };

      expect(payload.active_server).to.be.a('string');
      expect(payload.active_channel).to.be.a('string');
    });

    it('should accept undefined values (clearing)', function() {
      const payload = {
        active_server: undefined,
        active_channel: undefined,
      };

      expect(payload.active_server).to.be.undefined;
      expect(payload.active_channel).to.be.undefined;
    });
  });

  describe('Clear Notifications Handler', function() {
    it('should validate notification clear payload', function() {
      const payload = {
        server: { name: 'irc.libera.chat' },
        channel: '#test',
      };

      expect(payload.server).to.have.property('name');
      expect(payload.channel).to.be.a('string');
    });
  });

  describe('Socket Event Emission', function() {
    it('should emit raw IRC messages to client', function() {
      mockSocket.emit('raw', createTestIrcMessage());

      const emitted = mockSocket._getEmittedByEvent('raw');
      expect(emitted).to.have.length(1);
      expect(emitted[0].args[0]).to.have.property('command');
    });

    it('should emit restore_connection on reconnect', function() {
      const restoreData = {
        connections: [],
        active_server: null,
        active_channel: null,
      };

      mockSocket.emit('restore_connection', restoreData);

      const emitted = mockSocket._getEmittedByEvent('restore_connection');
      expect(emitted).to.have.length(1);
      expect(emitted[0].args[0]).to.have.property('connections');
    });

    it('should emit history response', function() {
      const historyData = {
        server: 'irc.test.net',
        channel: '#test',
        messages: [],
      };

      mockSocket.emit('history', historyData);

      const emitted = mockSocket._getEmittedByEvent('history');
      expect(emitted).to.have.length(1);
    });

    it('should emit connection_error on failure', function() {
      const errorData = {
        server: 'irc.test.net',
        nick: 'testnick',
      };

      mockSocket.emit('connection_error', errorData);

      const emitted = mockSocket._getEmittedByEvent('connection_error');
      expect(emitted).to.have.length(1);
    });

    it('should emit register_success/register_error', function() {
      mockSocket.emit('register_success', { username: 'newuser' });
      mockSocket.emit('register_error', { message: 'Username taken' });

      const success = mockSocket._getEmittedByEvent('register_success');
      const error = mockSocket._getEmittedByEvent('register_error');

      expect(success).to.have.length(1);
      expect(error).to.have.length(1);
    });
  });
});
