// Our dependency section of the connection module
// -----
//

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
var handle_irc = require("../src/js/handle_irc");

// Database models
var db = require("./models")();
var User = db.models.User,
Connection = db.models.Connection,
Session = db.models.Session,
Settings = db.models.Settings,
Message = db.models.Message;

var connections = {};
var loggers = {};

var logMessage = function(server, channel, message, username) {
  // We do not need to log status messages
  if(channel.replace("#", "") === "status") {
    return;
  }

  loggers[server] = loggers[server] || {};
  var target = loggers[server][channel];

  // If it is a private message
  if(channel.indexOf("#") === -1) {
    var targetIs = [channel, message.from].sort().join("#");
    target = loggers[server][targetIs];
    channel = targetIs;
  }

  if (typeof target === "undefined" || !(_.contains(connections, target))) {
    target = username;
  }

  if (target === username) {
    Message.create(_.extend(message, {server: server, to: channel}));
  }
};

var attach_listener = function(client, socket, backbone_models) {
  // Remove any extra listeners
  // we only want to keep the listener node-irc attaches
  // to the raw event
  if (typeof client._events.raw === "object") {
    client._events.raw = client._events.raw[0];
  }

  client.on("raw", function(message) {
    message = _.extend(message, {client_server: client.opt.server});

    if(socket.irc_conn) {
      handle_irc(message, socket.irc_conn, backbone_models);
    }
    socket.emit("raw", message);
  });
}

var restore_connection = function(user, io, req) {
  // See if our user has an active connection
  var backbone_models = require("../src/js/models/models");
  var has_connection = _.has(connections, user.username);

  // Find the socket associated with the reqeust
  var socket = _.find(io.sockets.clients(), function(client) {
    return client.id === req.body.socketid;
  });

  if (typeof backbone_models.irc === "undefined") {
    backbone_models.irc = socket.irc_conn = new backbone_models.models.App();
    backbone_models.username = user.username;
    backbone_models.logMessage = logMessage;
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
        if (typeof client._events["raw"] || client._events["raw"].length === 0) {
          attach_listener(client, socket, backbone_models);
        }
      });
    });
  } else {
    connections[user.username] = {clients: socket.clients, irc_conn: socket.irc_conn};
  }

  socket.logged_in = true;
  socket.user = user;
}

var connection = function(io, app) {
  app.get("/", function(req, res) {
    if (req.signedCookies.sessionid) {
      User.findOne({where: {session_id: req.signedCookies.sessionid}}, function(err, user) {
        res.render("index.ejs", {user: user});
      });
    } else {
      res.render("index.ejs", {user: false});
    }
  });

  app.post('/restore_connection/', function(req, resp) {
    var socket = _.find(io.sockets.clients(), function(client) {
      return client.id === req.body.socketid;
    });

    if (req.signedCookies.sessionid) {
      User.findOne({where: {session_id: req.signedCookies.sessionid}}, function(err, user) {
        if (user) {
          restore_connection(user, io, req);
        }
      });
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
              resp.cookie("sessionid", sessionid, {maxAge: 9000000, expires: new Date(Date.now()+9000000), httpOnly: true, signed: true});
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

  app.post('/logout/', function(req, resp) {
    var result = {success: true};
    if (req.signedCookies.sessionid) {
      User.findOne({where: {session_id: req.signedCookies.sessionid}}, function(err, user) {
        if(user) {
          user.session_id = null;
          user.save()
        }
      });
    }
    resp.clearCookie("sessionid");
    resp.send(result);
  });

  io.sockets.on("connection", function (socket) {
    socket.clients = {};

    if (socket.user) {
      Settings.findOne({where: {user_id: socket.user.id}}, function(err, settings) {
        if(settings) {
          socket.emit("settings", _.extend({}, JSON.parse(settings.settings)));
        } else {
          socket.emit("settings", client_settings);
        }
      });
    } else {
      socket.emit("settings", client_settings);
    }

    socket.on("connect", function(data) {
      var backbone_models = require("../src/js/models/models");
      var client = new irc.Client(data.server, data.nick, {
        channels: ["#test_metro"],
        debug: true
      });

      socket.clients[data.server] = client;

      attach_listener(client, socket, backbone_models);
    });

    socket.on("remove_connection", function(data) {
      socket.clients[data.connection].disconnect();
      delete socket.clients[data.connection];
      socket.emit("connection_removed", {connection: data.connection});

      // Remove connection from our local models
      if (socket.irc_conn) {
        socket.irc_conn.get("connections").remove(data.connection);
      }
    });

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

    socket.on("disconnect", function() {
      _.each(socket.clients, function(val, key, list) {
        // Clean up server conns
        if(!socket.logged_in) {
          val.disconnect();
          delete list[key];
        }
      });
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

      if (typeof socket.irc_conn !== "undefined") {
        var server = socket.irc_conn.get("connections").get(data.server);
        server.addMessage(data.target, {from: server.get("nick"), text: data.text, type: "PRIVMSG"});
      }

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
          var target_server = socket.irc_conn.get("connections")
          .get(client.opt.server);
          target_server.addChannel(args[1]);
          target_server.addMessage(args[1], {from: target_server.get("nick"), text: data.command.split(" ").splice(2).join(" ")});

          client.say(args[1], args.slice(2).join(" "));
          break;

        case "part":
        case "kick":
        case "topic":
          args = includeChannel(args);
          client.send.apply(client, args);
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

    socket.on("set_active", function(data) {
      socket.irc_conn.set(data);
    });

    // Clear viewed notifications from channel
    socket.on("clearnotifications", function(data) {
      if(typeof socket.irc_conn !== "undefined") {
        socket.irc_conn.get("connections")
        .get(data.server.name).get("channels")
        .get(data.channel).clearNotifications();
      }
    });

    socket.on("closeChannel", function(data) {
      socket.irc_conn.get("connections")
      .get(data.server).get("channels")
      .remove(data.target);
    });

    socket.on("loadHistory", function(data) {
      if(socket.user) {
        Message.all({where: {timestamp: {lte: data.timestamp}, server: data.server, to: data.channel}, order: 'id DESC', limit: 25}, function(er, messages) {
          socket.emit("history", {messages: messages.slice().reverse(), server: data.server, channel: data.channel});
        })
      }
    });

    socket.on("saveSettings", function(data) {
      if(socket.user) {
        Settings.findOne({where: {user_id: socket.user.id}}, function(err, settings) {
          var new_settings = {user_id: socket.user.id, settings: JSON.stringify(data)};
          if(settings) {
            settings.save(new_settings);
          } else {
            Settings.create(new_settings);
          }
        });
      }
    });

  });
};

module.exports = connection;