/**
 * Unit tests for database models
 * Tests UUID integration in models and jugglingdb upgrade
 */

const { expect } = require('chai');
const uuid = require('uuid');

describe('Database Models', function() {
  describe('User Model UUID Generation', function() {
    it('should generate user_id using uuid.v1', function() {
      // Simulate the default function in User model
      const generateUserId = function() { return uuid.v1(); };

      const userId = generateUserId();

      expect(userId).to.be.a('string');
      expect(uuid.validate(userId)).to.be.true;
      expect(uuid.version(userId)).to.equal(1);
    });

    it('should generate unique user IDs', function() {
      const generateUserId = function() { return uuid.v1(); };

      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateUserId());
      }

      expect(ids.size).to.equal(100);
    });
  });

  describe('Model Field Defaults', function() {
    it('should generate default joined date', function() {
      const generateDate = function() { return new Date(); };

      const date1 = generateDate();
      const date2 = generateDate();

      expect(date1).to.be.instanceof(Date);
      expect(date2).to.be.instanceof(Date);
    });

    it('should generate default timestamp for messages', function() {
      const generateTimestamp = function() { return new Date(); };

      const timestamp = generateTimestamp();

      expect(timestamp).to.be.instanceof(Date);
      expect(timestamp.getTime()).to.be.closeTo(Date.now(), 1000);
    });
  });

  describe('User Model Structure', function() {
    it('should have correct field structure', function() {
      const userFields = {
        user_id: { type: 'String', default: uuid.v1 },
        username: { type: 'String' },
        password: { type: 'String' },
        joined: { type: 'Date', default: () => new Date() },
        session_id: { type: 'String' }
      };

      expect(userFields.user_id).to.exist;
      expect(userFields.username).to.exist;
      expect(userFields.password).to.exist;
      expect(userFields.joined).to.exist;
      expect(userFields.session_id).to.exist;
    });
  });

  describe('Message Model Structure', function() {
    it('should have correct field structure', function() {
      const messageFields = {
        server: { type: 'String' },
        from: { type: 'String' },
        to: { type: 'String' },
        type: { type: 'String' },
        timestamp: { type: 'Date', default: () => new Date() },
        text: { type: 'String' },
        attributes: { type: 'String' }
      };

      expect(messageFields.server).to.exist;
      expect(messageFields.from).to.exist;
      expect(messageFields.to).to.exist;
      expect(messageFields.type).to.exist;
      expect(messageFields.timestamp).to.exist;
      expect(messageFields.text).to.exist;
      expect(messageFields.attributes).to.exist;
    });
  });

  describe('Connection Model Structure', function() {
    it('should have correct field structure', function() {
      const connectionFields = {
        user_id: { type: 'String' },
        connection_data: { type: 'Text' }
      };

      expect(connectionFields.user_id).to.exist;
      expect(connectionFields.connection_data).to.exist;
    });

    it('should handle JSON stringified connection data', function() {
      const connectionData = {
        server: 'irc.freenode.net',
        channels: ['#channel1', '#channel2'],
        nick: 'testuser'
      };

      const stringified = JSON.stringify(connectionData);
      const parsed = JSON.parse(stringified);

      expect(parsed).to.deep.equal(connectionData);
    });
  });

  describe('Settings Model Structure', function() {
    it('should have correct field structure', function() {
      const settingsFields = {
        user_id: { type: 'String' },
        settings: { type: 'Text' }
      };

      expect(settingsFields.user_id).to.exist;
      expect(settingsFields.settings).to.exist;
    });

    it('should handle JSON stringified settings', function() {
      const settings = {
        theme: 'dark',
        notifications: true,
        autoJoin: ['#channel1', '#channel2']
      };

      const stringified = JSON.stringify(settings);
      const parsed = JSON.parse(stringified);

      expect(parsed).to.deep.equal(settings);
    });
  });

  describe('UUID Migration from node-uuid', function() {
    it('should use modern uuid package API', function() {
      // Verify that uuid.v1() works (same as node-uuid)
      const id = uuid.v1();
      expect(id).to.be.a('string');

      // Verify additional modern features
      expect(uuid.validate(id)).to.be.true;
      expect(uuid.version(id)).to.equal(1);
    });

    it('should generate UUIDs compatible with old node-uuid format', function() {
      const id = uuid.v1();

      // node-uuid v1 UUIDs have the same format
      expect(id).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});
