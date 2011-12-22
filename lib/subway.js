var irc = require('irc'),
  app = require('./webserver').app,
  io = require('socket.io');

var Subway = function() {
  this.app = app;
  this.io = io;
  this.irc = irc;
}

Subway.prototype.start = function () {
  this.app.listen(3000);
  this.io.listen(this.app);
}

exports.subway = new Subway();
