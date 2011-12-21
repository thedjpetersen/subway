var irc = require('irc');
var io = require('socket.io');
var app = require('./webserver').app;

var Subway = exports.Subway = function() {
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
