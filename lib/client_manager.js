var irc = require("irc");
var _ = require("underscore");
var handleCommand = require("./handle_command");

// Utility method to return username or socketid
var getUsername = function(socket) {
  return socket.request.session.user ? socket.request.session.user.username : socket.id;
}

var ClientManager = function() {
  this.connections = {};
};

// Takes a socket and a server name
// and returns a client if it is exists
ClientManager.prototype.getClient = function(socket, server) {
  var username = getUsername(socket);

  if (!_.isUndefined(this.connections[username]) &&
      !_.isUndefined(this.connections[username][server])) {
    return this.connections[username][server];
  }
};

ClientManager.prototype.addClient = function(data, socket, io, room) {
  var client = new irc.Client(data.server, data.nick, data);

  client.on("netError", function(error) {
    io.to(room).emit("connectError", {client: client.opt.server, error: error});
  });

  // When we get a raw IRC command from the client
  // we want to pass it to the frontend
  client.on("raw", function(message) {
    var message = _.extend(message, {client_server: client.opt.server});
    io.to(room).emit("raw", message);
  });

  // Add client to the list of clients list
  var username = getUsername(socket);

  if (_.isUndefined(this.connections[username])) {
    this.connections[username] = {};
  }

  this.connections[username][client.opt.server] = client;

  // If the socket isn't associated with a user we want to 
  // disconnect when the user refreshes the browser
  if (_.isUndefined(socket.request.session.user)) {
    socket.on("disconnect", client.disconnect.bind(client));
  }
};

ClientManager.prototype.handleCommand = function(socket, data) {
  var client = this.getClient(socket, data.server);

  if(!_.isUndefined(client)) {
    handleCommand(client, data);
  }
};

ClientManager.prototype.handleSay = function(socket, data) {
  var client = this.getClient(socket, data.server);

  if(!_.isUndefined(client)) {
    client.say(data.target, data.text);
  }
};

module.exports = ClientManager;
