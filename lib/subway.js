/**
 * Subway main
 */

var config = require('../config')
  , events = require("events")
  , app = require('./webserver').app
  , server = require('./webserver').server
  , io = require('socket.io')
  , orm = require("orm");


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

  // get the db rolling
  orm.connect({ protocol: "sqlite", pathname: config.sqlite_path }, function (err, db) {
    // load in models
    db.load("./models", function (err) {
      // create tables if needed
      db.sync(function (err) {
        // map ORM to app object
        instance.app.db = db;

        // link up socket.io with our express app
        instance.app.io = io.listen(server);

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
        } 
      });
    });
  });
}

module.exports = Subway;