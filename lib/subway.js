/**
 * Subway main
 */

var config = require('../config')
  , events = require("events")
  , models = require("./models")
  , app = require('./webserver').app
  , server = require('./webserver').server
  , io = require('socket.io')
  , path = require("path");


// prevent crashes (node-irc is still unstable)
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err + '\n' + err.stack);
});

var Subway = function() {
  // setup namespace
  this.app = app;
  this.app.config = config;
  this.app.ircbridge = new events.EventEmitter();
  this.app.ircConnectionArray = [];
}

Subway.prototype.start = function () {
  var instance = this;

  var Schema = require('jugglingdb').Schema;
  var schema = new Schema(config.dbadapter, {
    database: config.dbname,
    username: config.dbusername,
    password: config.dbpassword,
    host: config.dbhost,
    port: config.dbport
  });

  // load in models, map ORM to app object
  instance.app.db = models(schema);

  // link up socket.io with our express app
  instance.app.io = io.listen(server);

  if (config.debug) {
    instance.app.io.set("log level", 3);
  }
  else {
    instance.app.io.set("log level", 1);
  }

  if (config.use_polling) {
    instance.app.io.configure(function() {
      instance.app.io.set("transports", ["xhr-polling"]);
      instance.app.io.set("polling duration", 10);
    });
  }

  // setup the IRC manager
  require('./ircmanager')(app);

  // setup the socket API
  var socketHandler = require('./socket');
  instance.app.io.sockets.on('connection', function(socket) {
    socketHandler(socket, app);
  });

  // restore connections
  require('./restore')(app);

  // debug
  if (server.address()) {
    console.log('Subway started on port %s', server.address().port);
    console.log('NOTE: it is safe to ignore any "no such table" errors.');
  }
}

module.exports = Subway;
