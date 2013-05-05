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

  // establish db models
  var User        = app.db.models.user;
  var Connection  = app.db.models.connection;
  var Message     = app.db.models.message;
  var PM          = app.db.models.pm;
  var Channel     = app.db.models.channel;

  // signal an IRC connection belonging to the user
  socket.xmitEvent = function(connection, event, dict) {
    var dict = (typeof dict === "undefined") ? {} : dict;
    // TODO: only allow xmit to connections belonging to the user
    // TODO: send back fail for all xmitEmit calls if connection is not online
    app.ircbridge.emit(connection, event, dict);
  }

  /* auth commands */

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

            // find all connections belonging to the user
            Connection.find({ user_id: socket.user.id }, function (err, connections) {
              var exists = false;
              if (connections.length > 0) {
                exists = true;
                // TEMPORARY - read note at top of this file on socket.connID
                socket.connID = connections[0].id;
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
      app.ircbridge.emit('create_irclink', socket.connID);
      socket.xmitEvent(socket.connID, 'restore');
      socket.xmitEvent(socket.connID, 'clearunreads');
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
      }

      Connection.create([{
        user_id: user_id
        , label: data.server
        , hostname: data.server
        , port: data.port || 6667
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
        , keepAlive: keepAlive
        , temporary: temp

      }], function (err, items) {
        if (!err) {
          // wake up the new connection
          socket.connID = items[0].id;
          app.ircbridge.emit('create_irclink', socket.connID);
          socket.xmitEvent(socket.connID, 'restore');
        }
      });
    }
  });

  socket.on('join', function(name) {
    if (name[0] != '#')
      name = '#' + name;
      
    socket.xmitEvent(socket.connID, 'join', {channel: name});
  });

  socket.on('part_pm', function(name){
    /*if(connection.client.chans[name.toLowerCase()] !== undefined){
      delete connection.client.chans[name.toLowerCase()];
    }*/
  });

  socket.on('part', function(name) {
    /*if (name[0] != '#')
      name = '#' + name;
    
    connection.client.part(name);
    if(current_user){
      // update the user's connection / channel list
      Connection.update({ user: current_user.username }, { $pull: { channels: name.toLowerCase() } }, function(err) {});
    }*/
  });

  socket.on('say', function(data) {
    // fire event to backend
    socket.xmitEvent(socket.connID, 'say', {to: data.target, text: data.message});
  });

  socket.on('action', function(data) {
    /*connection.client.action(data.target, data.message);
    socket.emit('message', {
      to: data.target.toLowerCase(),
      from: connection.client.nick,
      text: '\u0001ACTION ' + data.message}
    );*/
  });

  socket.on('whois', function(data) {
    //connection.client.whois(data.nick);
  });

  socket.on('topic', function(data){
    //connection.client.send('TOPIC ', data.name, data.topic);
  });

  socket.on('nick', function(data){
    /*connection.client.send('NICK', data.nick);
    connection.client.nick = data.nick;
    connection.client.opt.nick = data.nick;*/
  });

  socket.on('command', function(text) {
    //connection.client.send(text);
  });

  socket.on('disconnect', function() {
    /*if(!current_user){
      // not logged in, drop this session
      connection.disconnect();
    } else {
      if(connection.keepAlive) {
        // keep the session alive, remove this socket, and clear unreads
        connection.removeSocket(socket);
        connection.clearUnreads();
      }
      else {
        // disconnect the session
        connection.disconnect();
      }
    }*/
  });

  socket.on('disconnectServer', function() {
    /*connection.disconnect();
    connection = null;

    // remove current user and connect
    if(current_user) {
      connections[current_user.username].disconnect();
      connections[current_user.username] = undefined;
      current_user = null;
    }

    socket.emit('reset');*/
  });

  socket.on('getOldMessages', function(data){
    /*if (current_user) {
      var query = Message.find({channel: data.channelName.toLowerCase(), server: connection.server.toLowerCase(), linkedto: current_user.username});

      query.limit(data.amount);
      query.sort('date', -1);
      query.skip(data.skip);

      query.exec(function (err, results) {
        if(results){
          var returnData = {};
          if(results && results.length > 0){
            returnData['name'] = data.channelName.toLowerCase();
            returnData['messages'] = results;
          }
          socket.emit('oldMessages', returnData);
        }
      });
    }*/
  });

}