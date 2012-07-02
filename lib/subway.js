// register mongodb models
require('./models.js')()

var app = require('./webserver').app,
  irchandler = require('./irchandler'),
  io = require('socket.io'),
  mongoose = require('mongoose');

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

var Subway = function() {
  this.app = app;
}

Subway.prototype.start = function () {
  var app = this.app;
  var clients = {};
  
  mongoose.connect(app.set('mongoose_auth'));
  
  if (this.app.address()) console.log('Subway started on port %s', this.app.address().port);
  this.io = io.listen(this.app);
  
  require('./restore')(app, clients);
  
  this.io.sockets.on('connection', function(socket) {
    irchandler.irchandler(socket, app, clients);
  });
}

exports.subway = new Subway();