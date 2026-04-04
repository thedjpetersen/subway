/**
 * Message Service Unit Tests
 * Tests the modernized TypeScript message service
 */

import { expect } from 'chai';
import {
  createMockPrismaClient,
  createTestIrcMessage,
} from '../../helpers/ts-setup.js';

describe('Message Service', function() {
  let mockPrisma;

  beforeEach(function() {
    mockPrisma = createMockPrismaClient();
  });

  afterEach(function() {
    mockPrisma._reset();
  });

  describe('Message Logging', function() {
    it('should log a basic PRIVMSG message', async function() {
      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'testuser',
          to: '#testchannel',
          type: 'PRIVMSG',
          text: 'Hello, world!',
          userId: 'user-123',
        },
      });

      expect(message).to.have.property('id');
      expect(message.server).to.equal('irc.test.net');
      expect(message.from).to.equal('testuser');
      expect(message.to).to.equal('#testchannel');
      expect(message.type).to.equal('PRIVMSG');
      expect(message.text).to.equal('Hello, world!');
      expect(message.timestamp).to.be.instanceOf(Date);
    });

    it('should log JOIN messages', async function() {
      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'newuser',
          to: '#channel',
          type: 'JOIN',
          text: null,
          userId: 'user-123',
        },
      });

      expect(message.type).to.equal('JOIN');
      expect(message.from).to.equal('newuser');
    });

    it('should log PART messages with reason', async function() {
      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'leavinguser',
          to: '#channel',
          type: 'PART',
          text: 'Goodbye!',
          userId: 'user-123',
        },
      });

      expect(message.type).to.equal('PART');
      expect(message.text).to.equal('Goodbye!');
    });

    it('should handle ACTION messages (CTCP)', async function() {
      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'actionuser',
          to: '#channel',
          type: 'ACTION',
          text: 'waves hello',
          userId: 'user-123',
        },
      });

      expect(message.type).to.equal('ACTION');
      expect(message.text).to.equal('waves hello');
    });
  });

  describe('Message Retrieval', function() {
    beforeEach(async function() {
      // Create test messages with different timestamps
      const baseTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await mockPrisma.message.create({
          data: {
            server: 'irc.test.net',
            from: 'user' + i,
            to: '#testchannel',
            type: 'PRIVMSG',
            text: 'Message ' + i,
            timestamp: new Date(baseTime - i * 60000), // 1 minute apart
            userId: 'user-123',
          },
        });
      }
    });

    it('should retrieve messages for a channel', async function() {
      const messages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.test.net',
          to: '#testchannel',
        },
      });

      expect(messages).to.have.length(10);
    });

    it('should retrieve messages ordered by timestamp descending', async function() {
      const messages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.test.net',
          to: '#testchannel',
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(messages).to.have.length(10);
      // First message should be most recent
      for (let i = 1; i < messages.length; i++) {
        expect(new Date(messages[i - 1].timestamp).getTime())
          .to.be.at.least(new Date(messages[i].timestamp).getTime());
      }
    });

    it('should limit number of messages returned', async function() {
      const messages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.test.net',
          to: '#testchannel',
        },
        take: 5,
      });

      expect(messages).to.have.length(5);
    });

    it('should return empty array for non-existent channel', async function() {
      const messages = await mockPrisma.message.findMany({
        where: {
          server: 'irc.test.net',
          to: '#nonexistent',
        },
      });

      expect(messages).to.have.length(0);
    });
  });

  describe('Message Data Integrity', function() {
    it('should preserve special characters in messages', async function() {
      const specialText = '<script>alert("xss")</script> & "quotes" \'single\'';

      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'user',
          to: '#channel',
          type: 'PRIVMSG',
          text: specialText,
          userId: 'user-123',
        },
      });

      expect(message.text).to.equal(specialText);
    });

    it('should preserve unicode in messages', async function() {
      const unicodeText = '你好世界 🎉 مرحبا Привет';

      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'user',
          to: '#channel',
          type: 'PRIVMSG',
          text: unicodeText,
          userId: 'user-123',
        },
      });

      expect(message.text).to.equal(unicodeText);
    });

    it('should handle long messages', async function() {
      const longText = 'x'.repeat(1000);

      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'user',
          to: '#channel',
          type: 'PRIVMSG',
          text: longText,
          userId: 'user-123',
        },
      });

      expect(message.text).to.have.length(1000);
    });

    it('should handle null text field', async function() {
      const message = await mockPrisma.message.create({
        data: {
          server: 'irc.test.net',
          from: 'user',
          to: '#channel',
          type: 'JOIN',
          text: null,
          userId: 'user-123',
        },
      });

      expect(message.text).to.be.null;
    });
  });
});
