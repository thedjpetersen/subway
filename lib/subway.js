var irc = require('irc');
var io = require('socket.io').listen(5555);

var Subway = exports.Subway = function() {
  var self = this;
  self.io = io;
  self.irc = irc;
}

Subway.prototype.start = function () {
  var self = this;
}
