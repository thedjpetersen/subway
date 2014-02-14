var connect = require("connect"),
       http = require("http"),
      bower = require("bower"),
    suspend = require('suspend'),
    irc = require('irc'),
     resume = suspend.resume,
     _ = require("underscore");

var static = require("./lib/static");

var cwd = __dirname;

suspend(function*() {
  console.log("Installing dependencies...");
  var results = yield bower.commands.install().on("end", suspend.resumeRaw());

  yield static(suspend.resumeRaw());

  var app = connect()
    .use(connect.static(cwd + "/tmp"));

  var server = http.createServer(app).listen(3000);
  var io = require("socket.io").listen(server);

  io.sockets.on("connection", function (socket) {
    var clients = {};

    socket.on("connect", function(data) {
      var client = new irc.Client(data.server, data.nick, {
        channels: ["#test_metro"]
      });

      clients[data.server] = client;

      client.on("raw", function(message) {
        socket.emit("raw", _.extend(message, {client_server: client.opt.server}));
      });
    });

    socket.on("say", function(data) {
      var client = clients[data.server];
      client.say(data.target, data.text);
    });

    socket.on("command", function(data) {
      var client = clients[data.server];
      client[data.command].apply(this, data.args);
    });

    socket.on("raw", function(data) {
      var client = clients[data.server];
    });
  });

})();
