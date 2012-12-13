// register mongodb models
require('./models.js')()

var http = require('http'),
    app = require('./webserver').app,
    server = require('./webserver').server,
    sockethandler = require('./socket'),
    io = require('socket.io'),
    mongoose = require('mongoose');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

var Subway = function() {
  this.app = app;
  this.server = server;
}

Subway.prototype.start = function () {
  var connections = {};
  
  mongoose.connect(this.app.set('mongoose_auth'));
  
  // link up socket.io with our express app
  this.io = io.listen(server);
  
  this.io.sockets.on('connection', function(socket) {
    sockethandler(socket, connections);
  });
  
  // restore sessions
  require('./restore')(connections);
  
  if (this.server.address()) console.log('Subway started on port %s', this.server.address().port);
}

module.exports = Subway;