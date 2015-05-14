// Our dependency section of the connection module
// -----

// Basic library dependencies
var _ = require("underscore");
var models = require("./new_models");

var client_manager = require("./client_manager");
var cm = new client_manager();

var connection = function(io, app) {
  app.get("/", function(req, res) {
    require("./handlers/base")(req, res);
  });

  app.post('/login/', function(req, resp) {
    models.User.login(req.body.username, req.body.password)
    .then(function(user) {
      req.session.user = user;
      resp.send({success: true, username: user.username});
    })
    .error(function(error) {
      resp.status(400);
      resp.send(error);
    });
  });

  app.post('/register/', function(req, resp) {
    models.User.register(req.body.username, req.body.password)
    .then(function(user) {
      req.session.user = user;
      resp.send({success: true, username: user.username});
    }).error(function(error) {
      resp.status(400);
      resp.send(error);
    });
  });

  app.post('/logout/', function(req, resp) {
  });

  io.sockets.on("connection", function (socket) {
    // If we are dealing with a returning user we want to re-attach them to their channel
    if (socket.request.session.user) {
      socket.join(socket.request.session.user.username);
    }

    socket.on("ircconnect", function(data) {
      cm.addClient(data, socket, io, socket.request.session.user || socket.id);
    });

    socket.on("command", function(data) {
      cm.handleCommand(socket, data);
    });

    socket.on("say", function(data) {
      cm.handleSay(socket, data);
    });
  });
};

module.exports = connection;
