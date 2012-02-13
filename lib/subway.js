var irchandler = require('./irchandler'),
  app = require('./webserver').app,
  io = require('socket.io');

var Subway = function() {
  this.app = app;
}

Subway.prototype.start = function () {
  console.log('Subway started on port %s', this.app.address().port);
  this.io = io.listen(this.app);

  this.io.sockets.on('connection', function(socket) {
    irchandler.irchandler(socket);
  });
}

exports.subway = new Subway();