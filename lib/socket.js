var bcrypt = require('bcrypt-nodejs'),
    uuid = require('node-uuid');

module.exports = function(socket, app) {
  // once the user has authed, this will no longer be null
  socket.userID = null;

  // the user's IRC connection
  // NOTE: going forward as multi-connection support is implemented client side, this
  // will be removed and the user will signal which IRC connection they are controlling in
  // the socket.io event payload
  socket.connID = -1;
  socket.conn = null;
  socket.socketIORoom = null;

  // establish db models
  var User        = app.db.models.user;
  var Connection  = app.db.models.connection;
  var Message     = app.db.models.message;
  var PM          = app.db.models.pm;
  var Channel     = app.db.models.channel;

  // signal an IRC connection belonging to the user
  socket.signalIRC = function(connection, event, dict) {
    var dict = (typeof dict === "undefined") ? {} : dict;
    // TODO: only allow xmit to connections belonging to the user
    // TODO: send back fail for all xmitEmit calls if connection is not online
    app.ircbridge.emit(connection, event, dict);
  }

  /* auth/setup commands */

  // user registration
  socket.on('register', function(data) {
    // make sure user doesn't already exist
    User.count({ username: data.username }, function (err, count) {
      if (count === 0) {
        // hash the password
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(data.password, salt, null, function(err, hash) {
            // create the new user
            User.create([{
              user_id: uuid.v1()
              , username: data.username
              , password: hash
              , joined: Date.now()
            }], function (err, users) {
              socket.emit('register_success', {username: data.username});
              socket.userID = users[0].user_id;
              // subscribe to all online IRC connections using socket.io room
              socket.join(socket.userID);
              socket.socketIORoom = socket.userID;
            });
          });
        });
     } else {
        socket.emit('register_error', {message: 'User exists.'});
      }
    });
  });

  // user login
  socket.on('login', function(data){
    // find the user
    User.find({username: data.username}, function(err, users) {
      // does the user exist?
      if(users[0]){
        // check password
        bcrypt.compare(data.password, users[0].password, function(err, res) {
          // if the password matched...
          if(res === true){
            socket.userID = users[0].user_id;
            // subscribe to all online IRC connections using socket.io room
            socket.join(socket.userID);
            socket.socketIORoom = socket.userID;

            // find all connections belonging to the user
            Connection.find({ user_id: socket.userID }, function (err, connections) {
              var exists = false;
              if (connections.length > 0) {
                exists = true;
                // TEMPORARY - read note at top of this file on socket.connID
                socket.connID = connections[0].id;
                socket.conn = connections[0];
              }
              socket.emit('login_success', {username: data.username, exists: exists});
            });
          } else {
            socket.emit('login_error', {message: 'Wrong password'});
          }
        });
      } else {
        socket.emit('login_error', {message: 'User not found.'});
      }
    });
  });

  // connection creation/restore
  socket.on('connect', function(data) {
    if (socket.connID !== -1) {
      // the user is authed and already has a connection
      // wake up the connection in case it isn't already
      app.ircbridge.emit('restore_irclink', socket.connID);
      socket.signalIRC(socket.connID, 'restore');
      socket.signalIRC(socket.connID, 'clearunread');
    } else {
      // the user is authed and doesn't have a connection or guest is connecting

      // if the user is auth'd, grab their ID. -1 represents a guest
      var user_id = uuid.v1();
      var keepAlive = false;
      var temp = true;
      if (socket.userID !== null) {
        temp = false;
        user_id = socket.userID;
        if (data.keepAlive)
          keepAlive = true;
      } else {
        // subscribe to all online IRC connections using guest socket.io room
        socket.join(user_id);
        socket.socketIORoom = user_id;
      }

      Connection.create([{
        user_id: user_id
        , label: data.server
        , hostname: data.server
        , port: data.port || (data.secure ? 6697 : 6667)
        , nick: data.nick
        , away: data.away || 'AFK'
        , ssl: data.secure || false
        , selfSigned: data.selfSigned || false
        , encoding: data.encoding || ''
        , server_password: data.password || ''
        , nickserv_password: ''
        , nickserv_enabled: false
        , sasl_enabled: false
        , real_name: data.realName || data.nick
        , creation: Date.now()
        , disabled: false
        , disabled_timeout: Date.now()
        , disabled_reason: ''
        , keep_alive: keepAlive
        , temporary: temp
      }], function (err, items) {
        if (!err) {
          // wake up the new connection
          socket.connID = items[0].id;
          socket.conn = items[0];
          app.ircbridge.emit('restore_irclink', socket.connID);
          socket.signalIRC(socket.connID, 'restore');
        }
      });
    }
  });

  /* IRC commands */

  socket.on('join', function(name) {
    // if the user shorthanded the channel, add the '#'
    if (name[0] != '#')
      name = '#' + name;

    // make sure it's a valid name
    if (name.length < 2)
      return;
    
    // signal IRC link
    socket.signalIRC(socket.connID, 'join', {channel: name});
  });

  socket.on('part', function(name) {
    // if the user shorthanded the channel, add the '#'
    if (name[0] != '#')
      name = '#' + name;

    // make sure it's a valid name
    if (name.length < 2)
      return;
    
    // signal IRC link
    socket.signalIRC(socket.connID, 'part', {channel: name});
  });

  socket.on('say', function(data) {
    socket.signalIRC(socket.connID, 'say', {to: data.target, text: data.message});
  });

  socket.on('action', function(data) {
    socket.signalIRC(socket.connID, 'action', {target: data.target, message: data.message});
  });

  socket.on('whois', function(data) {
    socket.signalIRC(socket.connID, 'whois', {nick: data.nick});
  });

  socket.on('topic', function(data){
    socket.signalIRC(socket.connID, 'topic', {name: data.name, topic: data.topic});
  });

  socket.on('nick', function(data){
    socket.signalIRC(socket.connID, 'nick', {nick: data.nick});
  });

  socket.on('command', function(text) {
    socket.signalIRC(socket.connID, 'command', {command: text});
  });

  socket.on('disconnect', function() {
    // check if an IRC connection exists
    if (socket.connID !== -1) {
      if (socket.userID === null) {
        // guest, drop the connection
        socket.signalIRC(socket.connID, 'disconnect');
      } else {
        // user is registered, check if keepAlive is enabled
        if (!socket.conn.keep_alive) {
          // drop the connection
          socket.signalIRC(socket.connID, 'disconnect');
        } else {
          socket.signalIRC(socket.connID, 'clearunread');
        }
      }
    }
  });

  socket.on('logout', function() {
    // logout (reset socket state)
    socket.leave(socket.socketIORoom);
    socket.socketIORoom = null;
    if (socket.connID !== -1 && !socket.conn.keep_alive)
      socket.signalIRC(socket.connID, 'disconnect');
    socket.userID = null;
    socket.connID = -1;
    socket.conn = null;
    socket.emit('reset');
  });

  socket.on('getOldMessages', function(data){
    // make sure we're actually connected
    if (socket.connID !== -1 && socket.userID !== null) {
      // find requested messages
      Message.find({conn_id: socket.connID, chan:data.channelName.toLowerCase()}, { offset: data.skip }, data.amount, [ "at", "Z" ], function (err, messages) {
        if (!err) {
          var returnData = {};
          returnData.name = data.channelName.toLowerCase();
          returnData.messages = messages;
          socket.emit('oldMessages', returnData); 
        }
      });
    }
  });
}