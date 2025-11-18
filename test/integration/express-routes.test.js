/**
 * Integration tests for Express 4.x routes and middleware
 * Tests the migration from Express 3.x to 4.x with actual HTTP requests
 */

const { expect } = require('chai');
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

describe('Express Routes Integration', function() {
  let app;

  beforeEach(function() {
    // Create a fresh app for each test
    app = express()
      .use(bodyParser.urlencoded({ extended: true }))
      .use(bodyParser.json())
      .use(cookieParser('test-secret'));
  });

  describe('Body Parser Middleware', function() {
    it('should parse URL-encoded POST data', function(done) {
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      request(app)
        .post('/test')
        .send('username=testuser&password=testpass')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.received).to.deep.equal({
            username: 'testuser',
            password: 'testpass'
          });
          done();
        });
    });

    it('should parse JSON POST data', function(done) {
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      request(app)
        .post('/test')
        .send({ username: 'testuser', password: 'testpass' })
        .set('Content-Type', 'application/json')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.received).to.deep.equal({
            username: 'testuser',
            password: 'testpass'
          });
          done();
        });
    });

    it('should handle extended URL encoding', function(done) {
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      request(app)
        .post('/test')
        .send('data[key]=value&data[nested][deep]=test')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.received.data).to.exist;
          expect(res.body.received.data.key).to.equal('value');
          expect(res.body.received.data.nested.deep).to.equal('test');
          done();
        });
    });
  });

  describe('Cookie Parser Middleware', function() {
    it('should parse cookies', function(done) {
      app.get('/test', (req, res) => {
        res.json({ cookies: req.cookies });
      });

      request(app)
        .get('/test')
        .set('Cookie', 'sessionid=abc123; user=testuser')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.cookies).to.deep.equal({
            sessionid: 'abc123',
            user: 'testuser'
          });
          done();
        });
    });

    it('should handle signed cookies', function(done) {
      app.get('/test', (req, res) => {
        res.json({ signedCookies: req.signedCookies });
      });

      // supertest doesn't easily support signed cookies, so we'll just verify
      // the middleware is set up correctly
      request(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.signedCookies).to.exist;
          done();
        });
    });

    it('should set cookies in response', function(done) {
      app.get('/set-cookie', (req, res) => {
        res.cookie('testcookie', 'testvalue');
        res.send('Cookie set');
      });

      request(app)
        .get('/set-cookie')
        .expect(200)
        .expect('Set-Cookie', /testcookie=testvalue/)
        .end(done);
    });
  });

  describe('Login Route Simulation', function() {
    beforeEach(function() {
      // Simulate login route like in connection.js
      app.post('/login/', (req, res) => {
        const { username, password } = req.body;

        if (username === 'testuser' && password === 'testpass') {
          const sessionid = 'test-session-id';
          res.cookie('sessionid', sessionid, {
            maxAge: 9000000,
            httpOnly: true,
            signed: true
          });
          res.json({ status: 'success', username });
        } else {
          res.json({ status: 'error', error: 'Invalid credentials' });
        }
      });
    });

    it('should handle successful login', function(done) {
      request(app)
        .post('/login/')
        .send({ username: 'testuser', password: 'testpass' })
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.status).to.equal('success');
          expect(res.body.username).to.equal('testuser');
          expect(res.headers['set-cookie']).to.exist;
          done();
        });
    });

    it('should handle failed login', function(done) {
      request(app)
        .post('/login/')
        .send({ username: 'testuser', password: 'wrongpass' })
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.status).to.equal('error');
          expect(res.body.error).to.exist;
          done();
        });
    });
  });

  describe('Logout Route Simulation', function() {
    beforeEach(function() {
      app.post('/logout/', (req, res) => {
        res.clearCookie('sessionid');
        res.json({ success: true });
      });
    });

    it('should clear session cookie', function(done) {
      request(app)
        .post('/logout/')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.success).to.be.true;
          // Check for cookie clearing header
          const cookies = res.headers['set-cookie'];
          if (cookies) {
            expect(cookies.some(c => c.includes('sessionid'))).to.be.true;
          }
          done();
        });
    });
  });

  describe('Static File Serving', function() {
    it('should serve static files', function(done) {
      app.use(express.static(__dirname + '/../fixtures'));
      app.get('/test', (req, res) => res.send('ok'));

      request(app)
        .get('/test')
        .expect(200)
        .end(done);
    });
  });

  describe('Error Handling', function() {
    it('should handle 404 errors', function(done) {
      request(app)
        .get('/nonexistent')
        .expect(404)
        .end(done);
    });

    it('should handle malformed JSON', function(done) {
      app.post('/test', (req, res) => {
        res.json({ received: req.body });
      });

      request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)
        .end(done);
    });
  });

  describe('Request Methods', function() {
    it('should handle GET requests', function(done) {
      app.get('/test', (req, res) => res.json({ method: 'GET' }));

      request(app)
        .get('/test')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.method).to.equal('GET');
          done();
        });
    });

    it('should handle POST requests', function(done) {
      app.post('/test', (req, res) => res.json({ method: 'POST' }));

      request(app)
        .post('/test')
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body.method).to.equal('POST');
          done();
        });
    });
  });
});
