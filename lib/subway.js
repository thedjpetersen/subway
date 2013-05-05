/**
 * Module dependencies.
 */

var config = require('../config')
  , events = require("events")
  , app = require('./webserver').app
  , server = require('./webserver').server
  , io = require('socket.io')
  , orm = require("orm");


// Prevent crashes in production
if (!config.debug) {
  process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
  });
}

var Subway = function() {
  // Setup namespace
  this.app = app;
  this.app.server = server;
  this.app.config = config;
  this.app.ircbridge = new events.EventEmitter();
  this.app.ircConnectionArray = [];
  this.app.connectedSockets = [];
  this.app.ircManager = require('./ircmanager')(app);
}

Subway.prototype.start = function () {
  var instance = this;

  // get the db rolling
  orm.connect({ protocol: "sqlite", pathname: config.sqlite_path }, function (err, db) {
    db.load("./models", function (err) {
      db.sync(function (err) {
        // map ORM to app object
        instance.app.db = db;

        // link up socket.io with our express app
        instance.app.io = io.listen(server);
        
        // Setup the socket API
        var socketHandler = require('./socket');
        instance.app.io.sockets.on('connection', function(socket) {
          // sockets are identified by socket.io id
          instance.app.connectedSockets.push(socket.id);
          socketHandler(socket, app);
        });
        
        // restore sessions
        require('./restore')(app);
        
        // debug
        if (instance.app.server.address()) {
          console.log('Subway started on port %s', instance.app.server.address().port);
        } 
      });
    });
  });
}

module.exports = Subway;