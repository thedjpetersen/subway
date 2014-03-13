// Basic library dependencies
var _ = require("underscore");
var irc = require("irc");
var uuid = require("node-uuid");
var bcrypt = require('bcrypt-nodejs');

// Module for fetching plugins - the server can call this 
// when we want to fetch plugins that haven't been downloaded yet
var get_plugin = require("./plugins").get_plugin;

var client_settings = require("../settings/client");
var server_settings = require("../settings/server");

// Our client side IRC handling code and models
var backbone_models = require("../src/js/models/models");
var handle_irc = require("../src/js/handle_irc");

// Database models
var db = require("./models")();
var User = db.models.User,
Connection = db.models.Connection,
Session = db.models.Session,
Settings = db.models.Settings,
Message = db.models.Message;

var connections = {};

var restore_connection = function(user, io, req) {
  // See if our user has an active connection
  var has_connection = _.has(connections, user.username);

  socket = _.find(io.sockets.clients(), function(client) {
    return client.id === req.body.socketid;
  });

  if (socket.irc_conn === undefined) {
    backbone_models.irc.connections = socket.irc_conn = new backbone_models.collections.Connections();
  }

  if (socket !== undefined && has_connection) {
    socket.clients = connections[user.username].clients;
    socket.irc_conn = connections[user.username].irc_conn;

    var user_id = user.user_id;
    Connection.findOne({where: {user_id: user_id}}, function(err, connection) {
      if (connection && has_connection) {
        socket.emit("restore_connection", socket.irc_conn.toJSON());
      }

      // Reattach our raw emitter
      _.each(socket.clients, function(client) {
        client.on("raw", function(message) {
          message = _.extend(message, {client_server: client.opt.server});
          socket.emit("raw", message);
        });
      });
    });
  } else {
    connections[user.username] = {clients: socket.clients, irc_conn: socket.irc_conn};
  }

  socket.logged_in = true;
  socket.user = user;
}

var connection = function(io, app) {
  app.post('/is_logged_in/', function(req, resp) {
    result = {logged_in: false};

    if (req.signedCookies.sessionid) {
      User.findOne({where: {session_id: req.signedCookies.sessionid}}, function(err, user) {
        if (user) {
          restore_connection(user, io, req);
          resp.send({logged_in: true, client_length: _.keys(socket.clients).length, username: user.username });
        } else {
          resp.send(result);
        }
      });
    } else {
      resp.send(result);
    }
  });

  app.post('/login/', function(req, resp) {
    var result = {};
    // find the user
    User.findOne({where: {username: req.body.username}}, function(err, user) {
      // does the user exist?
      if (user) {
        // check password
        bcrypt.compare(req.body.password, user.password, function(err, res) {
          // if the password matched...
          if(res === true){


            // See if our user has an active connection
            var has_connection = _.has(connections, user.username);
            var sessionid = uuid.v1() + uuid.v4();

            user.session_id = sessionid;

            user.save(function() {
              restore_connection(user, io, req);

              result = {status: "success", username: req.body.username, has_connection: has_connection};
              resp.cookie("sessionid", sessionid, {maxAge: 90000, httpOnly: true, signed: true});
              resp.send(result);
            });
          } else {
            result = {status: "error", error: "Wrong password"};
            resp.send(result);
          }
        });
      } else {
        result = {status: "error", error: "User not found"};
        resp.send(result);
      }
    });
  });

  io.sockets.on("connection", function (socket) {
    socket.clients = {};

    socket.emit("settings", client_settings);

    socket.on("disconnect", function(data) {
      if(socket.logged_in) {
        Connection.findOne({where: {user_id: socket.user.user_id}}, function(err, connection) {
          if(!connection) {
            connection = new Connection({
              user_id: socket.user.user_id,
              connection_data: JSON.stringify(socket.irc_conn)
            });
          } else {
            connection.connection_data = JSON.stringify(socket.irc_conn);
          }
          connection.save();
        });
      }
    });

    socket.on("connect", function(data) {
      var client = new irc.Client(data.server, data.nick, {
        channels: ["#test_metro"],
        debug: true
      });

      socket.clients[data.server] = client;

      client.on("raw", function(message) {
        message = _.extend(message, {client_server: client.opt.server});
        if(socket.irc_conn) {
          handle_irc(message, socket.irc_conn, backbone_models);
        }
        socket.emit("raw", message);
      });
    });

    socket.on("remove_connection", function(data) {
      socket.clients[data.connection].disconnect();
      delete socket.clients[data.connection];
      socket.emit("connection_removed", {connection: data.connection});
    });

    socket.on("disconnect", function() {
      if(!socket.logged_in) {
        _.each(socket.clients, function(val, key, list) {
          // Clean up server conns
          val.disconnect();
          delete list[key];
        });
      }
    });

    /* auth/setup commands */

    // user registration
    socket.on('register', function(data) {
      // make sure user doesn't already exist
      User.findOne({where: { username: data.username }}, function (err, fUser) {
        if (!err && !fUser) {
          // hash the password
          bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(data.password, salt, null, function(err, hash) {
              // create the new user
              User.create({
                username: data.username,
                password: hash
              }, function (err, user) {
                socket.emit('register_success', {username: data.username});
              });
            });
          });
        } else {
          socket.emit('register_error', {message: 'The username "' + data.username + '" is taken, please try another username.'});
        }
      });
    });

    socket.on("say", function(data) {
      var client = socket.clients[data.server];
      client.say(data.target, data.text);
    });

    socket.on("command", function(data) {
      var client = socket.clients[data.server];
      var args;
      if (data.command) {
        args = data.command.split(" ");
      } else {
        args = [""];
      }

      // If the arguments don't include the channel we add it
      var includeChannel = function(args) {
        if(args.length > 1) {
          return args[1].indexOf("#") !== 0 ? args.splice(1,0,data.target) : args;
        } else if (args.length === 1) {
          return args.splice(1,0,data.target);
        } else {
          return args;
        }
      };

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

        case "part":
        case "kick":
        case "topic":
          client.send.apply(client, includeChannel(args));
          break;

        case "admin":
          client.send.apply(client, args);
          break;

        default:
          client.send.apply(client, args);
          break;
      }
    });

    socket.on("raw", function(data) {
      var client = socket.clients[data.server];
      client.send.apply(this, data.args);
    });

    socket.on("add_plugin", function(data) {
      get_plugin(data.plugin, function() {
        socket.emit("plugin_added", {plugin: data.plugin});
      });
    });
  });
};

module.exports = connection;
