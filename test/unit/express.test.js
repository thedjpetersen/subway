/**
 * Unit tests for Express 4.x integration
 * Tests the upgrade from Express 3.x to Express 4.x
 */

const { expect } = require('chai');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

describe('Express 4.x Integration', function() {
  describe('Middleware Setup', function() {
    it('should create an Express app', function() {
      const app = express();
      expect(app).to.be.a('function');
      expect(app).to.have.property('use');
      expect(app).to.have.property('get');
      expect(app).to.have.property('post');
    });

    it('should use bodyParser.urlencoded middleware', function() {
      const app = express();
      const middleware = bodyParser.urlencoded({ extended: true });

      expect(middleware).to.be.a('function');
      app.use(middleware);

      // Verify app has middleware stack
      expect(app._router).to.exist;
    });

    it('should use cookieParser middleware', function() {
      const app = express();
      const middleware = cookieParser('test-secret');

      expect(middleware).to.be.a('function');
      app.use(middleware);

      // Verify app has middleware stack
      expect(app._router).to.exist;
    });

    it('should chain middleware like in subway.js', function() {
      const app = express()
        .use(bodyParser.urlencoded({ extended: true }))
        .use(cookieParser('subway_secret'))
        .use(express.static(__dirname + '/fixtures'));

      expect(app._router).to.exist;
      expect(app._router.stack).to.be.an('array');
      expect(app._router.stack.length).to.be.greaterThan(0);
    });
  });

  describe('Settings Configuration', function() {
    it('should set views directory without app.configure', function() {
      const app = express();

      // Express 4 doesn't need app.configure
      app.set('views', __dirname + '/views');

      expect(app.get('views')).to.equal(__dirname + '/views');
    });

    it('should set view engine', function() {
      const app = express();
      const ejs = require('ejs');

      app.engine('ejs', ejs.renderFile);
      app.set('view engine', 'ejs');

      expect(app.get('view engine')).to.equal('ejs');
    });
  });

  describe('bodyParser.urlencoded Options', function() {
    it('should accept extended option', function() {
      const middleware = bodyParser.urlencoded({ extended: true });
      expect(middleware).to.be.a('function');
    });

    it('should create middleware with extended: false', function() {
      const middleware = bodyParser.urlencoded({ extended: false });
      expect(middleware).to.be.a('function');
    });
  });

  describe('cookieParser Configuration', function() {
    it('should accept a secret string', function() {
      const middleware = cookieParser('my-secret');
      expect(middleware).to.be.a('function');
    });

    it('should work without a secret', function() {
      const middleware = cookieParser();
      expect(middleware).to.be.a('function');
    });
  });

  describe('Routing', function() {
    it('should support GET routes', function() {
      const app = express();
      app.get('/test', (req, res) => res.send('test'));

      // Check that route was registered
      const routes = app._router.stack.filter(layer => layer.route);
      expect(routes).to.have.length.greaterThan(0);
    });

    it('should support POST routes', function() {
      const app = express();
      app.post('/test', (req, res) => res.send('test'));

      // Check that route was registered
      const routes = app._router.stack.filter(layer => layer.route);
      expect(routes).to.have.length.greaterThan(0);
    });
  });

  describe('Backward Compatibility with Express 3.x', function() {
    it('should not have app.configure method', function() {
      const app = express();

      // Express 4 removed app.configure
      expect(app.configure).to.be.undefined;
    });

    it('should have express.urlencoded but require options', function() {
      // Express 4 has urlencoded back but as a factory function
      expect(express.urlencoded).to.be.a('function');
      // It should return middleware when called with options
      const middleware = express.urlencoded({ extended: true });
      expect(middleware).to.be.a('function');
    });

    it('should not have express.cookieParser as a method', function() {
      // Express 4 removed cookieParser from express namespace
      // Accessing it throws a helpful error
      try {
        const cp = express.cookieParser;
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('middleware');
      }
    });

    it('should still support express.static', function() {
      // express.static is one of the few that remained
      expect(express.static).to.be.a('function');
    });
  });
});
