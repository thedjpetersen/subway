// Our dependency section of the connection module
// -----

// Basic library dependencies
var _ = require("underscore");
var irc = require("slate-irc");
var net = require("net");
var models = require("./new_models");

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
  });
};

module.exports = connection;
