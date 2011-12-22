var irchandler = require('./irchandler'),
  app = require('./webserver').app,
  io = require('socket.io');

var Subway = function() {
  this.app = app;
}

Subway.prototype.start = function () {
  this.app.listen(3000);
  this.io = io.listen(this.app);

  this.io.sockets.on('connection', function(socket) {
    irchandler.irchandler(socket);
  });
}

exports.subway = new Subway();
