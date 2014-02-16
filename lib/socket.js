var bcrypt = require('bcrypt-nodejs'),
    uuid = require('node-uuid'),
    crypto = require('crypto');

function isChannel(name) {
  return ['#','&'].indexOf(name[0]) >= 0;
}

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
  var User        = app.db.models.User;
  var Connection  = app.db.models.Connection;
  var Message     = app.db.models.Message;
  var PM          = app.db.models.PM;
  var Channel     = app.db.models.Channel;
  var Session     = app.db.models.Session;

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
    User.findOne({where: { username: data.username }}, function (err, fUser) {
      if (!err && !fUser) {
        // hash the password
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(data.password, salt, null, function(err, hash) {
            // create the new user
            User.create({
              user_id: uuid.v1()
              , username: data.username
              , password: hash
              , joined: Date.now()
            }, function (err, user) {
              socket.session_create(data, user.user_id, function(data, auth_token) {
                socket.emit('register_success', {username: data.username, auth_token: auth_token});
                socket.userID = user.user_id;
                // subscribe to all online IRC connections using socket.io room
                socket.join(socket.userID);
                socket.socketIORoom = socket.userID;
              });
            });
          });
        });
      } else {
        socket.emit('register_error', {message: 'The username "' + data.username + '" is taken, please try another username.'});
      }
    });
  });

  // user login
  socket.on('login', function(data){
    // find the user
    User.findOne({where: {username: data.username}}, function(err, user) {
      // does the user exist?
      if(user){
        // check password
        bcrypt.compare(data.password, user.password, function(err, res) {
          // if the password matched...
          if(res === true){
            socket.userID = user.user_id;
            // subscribe to all online IRC connections using socket.io room
            socket.join(socket.userID);
            socket.socketIORoom = socket.userID;

            // find all connections belonging to the user
            Connection.all({where: { user_id: socket.userID } }, function (err, connections) {
              var exists = false;
              if (connections.length > 0) {
                exists = true;
                // TEMPORARY - read note at top of this file on socket.connID
                socket.connID = connections[0].id;
                socket.conn = connections[0];
              }
              socket.session_create(data, user.user_id, function(data, auth_token){
                socket.emit('login_success', { username: data.username,
                                               exists: exists,
                                               auth_token: auth_token });
              });
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
  
  socket.session_create = function(data, user_id, callback) {
    /*
     * Add the successful login to the session database.
     */
    // Create a sha1-hash based on username and secret key
    var hash = crypto.createHash('sha1');
    var auth_token = hash.update(data.username + app.config.secret_key).digest('hex');

    // Delete any previous sessions for this user_id.
    Session.all({ where: { user_id: user_id } }, function(err, sessions){
      sessions.forEach(function(session){
        session.destroy();
      });
    })

    var now = new Date();
    Session.create({
      auth_token: auth_token,
      username: data.username,
      user_id: user_id,
      expires: new Date().setHours(now.getHours() + app.config.cookie_time),
    });
    callback(data, auth_token);
  }

  socket.on('session_check', function(data){
    /*
     * Check if the token provides is valid, that is: in the database and not
     * expired. If found we restore the users connections, if any, and log in.
     */
    Session.findOne({ where: { auth_token: data.auth_token}}, function(err, session){
      var now = new Date();
      if(session && session.expires > now) {
        // TODO: Join the logic inside here, with the logic inside on('login')
        socket.userID = session.user_id;
        socket.join(socket.userID);
        socket.socketIORoom = socket.userID;

        Connection.all({where: { user_id: session.user_id } }, function (err, connections) {
          var exists = false;
          if (connections.length > 0) {
            exists = true;
            // TEMPORARY - read note at top of this file on socket.connID
            socket.connID = connections[0].id;
            socket.conn = connections[0];
          }
          socket.emit('login_success', { username: session.username, exists: exists })
        });
      } else {
        if (session && session.expires < now) {
          // Delete session if it is expired.
          session.destroy();
        }
        // In this situation, which should be rare, the client has a cookie
        // which is not in the database. Thus we just want to delete the cookie
        // at the client.
        socket.emit('session_not_found');
      }
    })
  });

  socket.on('session_delete', function(data){
    Session.findOne({ where: {auth_token: data.auth_token}}, function(err, session){
      if (session) {
        session.destroy(); 
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

      if (app.config.server_whitelist &&
          app.config.server_whitelist.indexOf(data.server.toLowerCase()) < 0) {
        socket.emit('connect_error', {
          message: 'Server not allowed. Server name should be in: ' + app.config.server_whitelist
        });
        return;
      }

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

      Connection.create({
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
        , stripColors: data.stripColors
        , temporary: temp
      }, function (err, item) {
        if (!err) {
          // wake up the new connection
          socket.connID = item.id;
          socket.conn = item;
          app.ircbridge.emit('restore_irclink', socket.connID);
          socket.signalIRC(socket.connID, 'restore');
        }
      });
    }
  });

  /* IRC commands */

  socket.on('join', function(name) {
    // if the user shorthanded the channel, add the '#'
    if (!isChannel(name))
      name = '#' + name;

    // make sure it's a valid name
    if (name.length < 2)
      return;
    
    // signal IRC link
    socket.signalIRC(socket.connID, 'join', {channel: name});
  });

  socket.on('part', function(name) {
    // if the user shorthanded the channel, add the '#'
    if (!isChannel(name))
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

  socket.on('list', function(data){
    socket.signalIRC(socket.connID, 'list', data);
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
      Message.all({where: {conn_id: socket.connID, chan:data.channelName.toLowerCase()}, order: 'at DESC', limit: data.amount, skip: data.skip}, function (err, messages) {
        var parsedMessages = [];
        var returnData = {};

        if (!err) {
          // frontend expects 'by' field as 'from'
          for (var i=0; i<messages.length; i++) {
            var msg = messages[i].toObject();
            msg['from'] = msg['by'];
            delete msg['by'];
            parsedMessages.push(msg);
          }
          
          returnData.name = data.channelName.toLowerCase();
          returnData.messages = parsedMessages;
          socket.emit('oldMessages', returnData); 
        }
      });
    }
  });
}
