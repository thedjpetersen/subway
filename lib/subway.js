var irc = require('irc'),
    app = require('./webserver').app,
    io = require('socket.io');

var Subway = function() {
  var self = this;
  self.app = app;
  self.io = io;
  self.irc = irc;
}

Subway.prototype.start = function () {
    var self = this;
    self.app.listen(3000);
    self.io.listen(self.app);
}

exports.subway = new Subway();
