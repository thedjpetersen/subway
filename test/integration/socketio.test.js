/**
 * Integration tests for Socket.io 4.x
 * Tests the upgrade from Socket.io 1.0.x to 4.x
 */

const { expect } = require('chai');
const http = require('http');
const { Server } = require('socket.io');
const ioc = require('socket.io-client');

describe('Socket.io Integration', function() {
  let io, serverSocket, clientSocket, httpServer;

  beforeEach(function(done) {
    httpServer = http.createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = ioc(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterEach(function() {
    io.close();
    clientSocket.close();
  });

  describe('Connection', function() {
    it('should connect client to server', function() {
      expect(clientSocket.connected).to.be.true;
      expect(serverSocket).to.exist;
    });

    it('should have socket id', function() {
      expect(clientSocket.id).to.be.a('string');
      expect(serverSocket.id).to.be.a('string');
    });
  });

  describe('Event Emission', function() {
    it('should emit events from client to server', function(done) {
      serverSocket.on('test_event', (data) => {
        expect(data.message).to.equal('hello');
        done();
      });

      clientSocket.emit('test_event', { message: 'hello' });
    });

    it('should emit events from server to client', function(done) {
      clientSocket.on('test_event', (data) => {
        expect(data.message).to.equal('hello');
        done();
      });

      serverSocket.emit('test_event', { message: 'hello' });
    });

    it('should handle multiple events', function(done) {
      let count = 0;

      serverSocket.on('event1', () => count++);
      serverSocket.on('event2', () => count++);
      serverSocket.on('event3', () => {
        count++;
        expect(count).to.equal(3);
        done();
      });

      clientSocket.emit('event1');
      clientSocket.emit('event2');
      clientSocket.emit('event3');
    });
  });

  describe('IRC-like Events (Subway Pattern)', function() {
    it('should handle connectirc event', function(done) {
      serverSocket.on('connectirc', (data) => {
        expect(data.server).to.exist;
        expect(data.nick).to.exist;
        done();
      });

      clientSocket.emit('connectirc', {
        server: 'irc.freenode.net',
        nick: 'testuser'
      });
    });

    it('should handle say event', function(done) {
      serverSocket.on('say', (data) => {
        expect(data.server).to.exist;
        expect(data.target).to.exist;
        expect(data.text).to.exist;
        done();
      });

      clientSocket.emit('say', {
        server: 'irc.freenode.net',
        target: '#testchannel',
        text: 'Hello world'
      });
    });

    it('should handle command event', function(done) {
      serverSocket.on('command', (data) => {
        expect(data.server).to.exist;
        expect(data.command).to.exist;
        done();
      });

      clientSocket.emit('command', {
        server: 'irc.freenode.net',
        command: 'join #testchannel'
      });
    });

    it('should handle register event', function(done) {
      serverSocket.on('register', (data) => {
        expect(data.username).to.exist;
        expect(data.password).to.exist;
        done();
      });

      clientSocket.emit('register', {
        username: 'newuser',
        password: 'password123'
      });
    });
  });

  describe('Raw Event Handling', function() {
    it('should emit raw IRC messages', function(done) {
      clientSocket.on('raw', (message) => {
        expect(message).to.be.an('object');
        done();
      });

      serverSocket.emit('raw', {
        command: 'PRIVMSG',
        args: ['#channel', 'Hello']
      });
    });
  });

  describe('Disconnection', function() {
    it('should handle client disconnect', function(done) {
      serverSocket.on('disconnect', () => {
        done();
      });

      clientSocket.close();
    });

    it('should cleanup on disconnect', function(done) {
      serverSocket.on('disconnect', () => {
        // Disconnect event fired successfully
        done();
      });

      clientSocket.close();
    });
  });

  describe('Custom Data Handling', function() {
    it('should handle socketid in request body pattern', function(done) {
      // Simulate the pattern used in connection.js
      const socketId = clientSocket.id;

      serverSocket.on('test_with_id', (data) => {
        expect(data.socketid).to.equal(socketId);
        done();
      });

      clientSocket.emit('test_with_id', {
        socketid: socketId,
        otherData: 'test'
      });
    });

    it('should handle JSON stringified data', function(done) {
      const complexData = {
        server: 'irc.freenode.net',
        channels: ['#channel1', '#channel2'],
        settings: { autoJoin: true }
      };

      serverSocket.on('complex_data', (data) => {
        expect(data).to.deep.equal(complexData);
        done();
      });

      clientSocket.emit('complex_data', complexData);
    });
  });

  describe('Broadcasting', function() {
    it('should broadcast to all clients', function(done) {
      const client2 = ioc(`http://localhost:${httpServer.address().port}`);

      client2.on('broadcast', (data) => {
        expect(data.message).to.equal('broadcast message');
        client2.close();
        done();
      });

      setTimeout(() => {
        io.emit('broadcast', { message: 'broadcast message' });
      }, 50);
    });
  });

  describe('Namespaces', function() {
    it('should support debug namespace', function(done) {
      const debugNamespace = io.of('/debug');
      const debugClient = ioc(`http://localhost:${httpServer.address().port}/debug`);

      debugNamespace.on('connection', (socket) => {
        expect(socket.nsp.name).to.equal('/debug');
        debugClient.close();
        done();
      });
    });
  });
});
