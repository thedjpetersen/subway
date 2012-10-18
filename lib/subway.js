// register mongodb models
require('./models.js')()

var app = require('./webserver').app,
  sockethandler = require('./socket'),
  io = require('socket.io'),
  mongoose = require('mongoose');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

var Subway = function() {
  this.app = app;
}

Subway.prototype.start = function () {
  var connections = {};
  
  mongoose.connect(this.app.set('mongoose_auth'));
  
  // link up socket.io with our express app
  this.io = io.listen(this.app);
  
  this.io.sockets.on('connection', function(socket) {
    sockethandler(socket, connections);
  });
  
  // restore sessions
  require('./restore')(connections);
  
  if (this.app.address()) console.log('Subway started on port %s', this.app.address().port);
}

module.exports = Subway;
