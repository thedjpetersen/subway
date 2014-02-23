var _ = require("underscore");
var irc = require("irc");
var client_settings = require("../settings/client");
var get_plugin = require("plugin");

var connection = function(io) {
  io.sockets.on("connection", function (socket) {
    var clients = {};

    socket.emit("settings", client_settings);

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
      var args = data.command.split(" ");

      switch (args[0].toLowerCase()) {
        case "join":
          client.join(args[1]);
          break;

        case "leave":
          client.part(data.target, _.rest(args).join(" "));
          break;

        case "me":
          // Send a sentence
          client.action(data.target, args.slice(1).join(" "));
          break;

        case "msg":
          client.say(args[1], args.slice(2).join(" "));
          break;

        default:
          break;
      }
    });

    socket.on("raw", function(data) {
      var client = clients[data.server];
      client.send.apply(this, data.args);
    });

    socket.on("disconnect", function() {
      _.each(clients, function(val, key, list) {
        // Clean up server connections
        val.disconnect();
        delete list[key];
      });
    });

    socket.on("add_plugin", function(data) {
      get_plugin(data.plugin, function() {
        socket.emit("plugin_added", {plugin: data.plugin});
      });
    });
  });
};

module.exports = connection;
