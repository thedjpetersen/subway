/**
 * Test setup and helper utilities
 */

const chai = require('chai');

// Global test configuration
global.expect = chai.expect;

// Increase default timeout for integration tests
if (typeof process.env.TEST_TIMEOUT === 'undefined') {
  process.env.TEST_TIMEOUT = '10000';
}

// Suppress console output during tests unless explicitly enabled
// (Can be enabled with DEBUG_TESTS=1 environment variable)
if (!process.env.DEBUG_TESTS) {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Suppress console output immediately
  console.log = function() {};
  console.error = function() {};
  console.warn = function() {};

  // Restore on process exit
  process.on('exit', function() {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
}

/**
 * Helper to create a mock socket.io socket
 */
function createMockSocket() {
  const events = {};

  return {
    id: 'mock-socket-id',
    clients: {},
    logged_in: false,
    user: null,
    irc_conn: null,

    on: function(event, handler) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(handler);
    },

    emit: function(event, data) {
      if (events[event]) {
        events[event].forEach(handler => handler(data));
      }
    },

    trigger: function(event, data) {
      if (events[event]) {
        events[event].forEach(handler => handler(data));
      }
    }
  };
}

/**
 * Helper to create a mock IRC client
 */
function createMockIRCClient() {
  const events = {};

  return {
    opt: {
      server: 'irc.test.net',
      userName: 'testuser'
    },

    _events: {
      raw: []
    },

    on: function(event, handler) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(handler);
      if (event === 'raw') {
        this._events.raw.push(handler);
      }
    },

    emit: function(event, data) {
      if (events[event]) {
        events[event].forEach(handler => handler(data));
      }
    },

    say: function(target, message) {
      return { target, message };
    },

    join: function(channel) {
      return { channel };
    },

    part: function(channel, message) {
      return { channel, message };
    },

    disconnect: function() {
      this.emit('disconnect');
    }
  };
}

/**
 * Helper to wait for a condition
 */
async function waitFor(conditionFn, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Timeout waiting for condition');
}

/**
 * Helper to create a test user object
 */
function createTestUser(overrides = {}) {
  const uuid = require('uuid');
  const bcrypt = require('bcrypt');

  return {
    user_id: uuid.v1(),
    username: 'testuser',
    password: bcrypt.hashSync('testpassword', 10),
    joined: new Date(),
    session_id: null,
    ...overrides
  };
}

module.exports = {
  createMockSocket,
  createMockIRCClient,
  waitFor,
  createTestUser
};
