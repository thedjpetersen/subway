var bcrypt = require('bcrypt-nodejs');

module.exports = function(socket, app) {
  // once we are authed, this will no longer be null
  socket.user = null;

  // TODO: establish models

  socket.xmitEvent = function(connection, event, dict) {
    // TODO: only allow xmit to connections belonging to the user
    // TODO: send back fail for all xmitEmit calls if connection is not online
    app.ircbridge.emit(connection, event, dict);
  }

  // TODO: lock down queries to only return connections that belong to user
  // TODO: idiot proof data inputs

  /* auth commands */
  // socket.user = doc;
  // subscribe to all online IRC connections
  // socket.join(socket.user._id);

  socket.on('register', function(data) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(data.password, salt, function(err, hash) {
        // Store hash in your password DB.
        /*var user = new User();
        user.username = data.username;
        user.password = hash;
        user.save();
        socket.emit('register_success', {username: user.username});
        socket.user = user;*/
      });
    });
  });

  socket.on('login', function(data){
    /*User.findOne({username: data.username}, function(err, user) {
      if(user){
        bcrypt.compare(data.password, user.password, function(err, res) {
          if(res === true){
            var exists;
            current_user = user;
            if(connections[user.username] !== undefined){
              exists = true;
            } else {
              exists = false;
            }
            socket.emit('login_success', {username: user.username, exists: exists});
          } else {
            socket.emit('login_error', {message: 'Wrong password'});
          }
        });
      } else {
        socket.emit('login_error', {message: 'No user'});
      }
    });*/
  });

  socket.on('connect', function(data) {
    /*var connection;
    if(current_user){
      connection = connections[current_user.username];
    }
    if(connection === undefined) {
      connection = new IRCLink(data.server, data.port, data.secure, data.selfSigned, data.nick, data.realName, data.password, data.rejoin, data.away, data.encoding, data.keepAlive);
      
      // save this connection
      if(current_user){
        // bind this socket to the proper IRC instance
        connection.associateUser(current_user.username);
        
        var conn = new Connection({ user: current_user.username,
                                    hostname: data.server,
                                    port: data.port || (data.secure ? 6697 : 6667),
                                    ssl: data.secure,
                                    rejoin: data.rejoin,
                                    away: data.away,
                                    realName: data.realName,
                                    selfSigned: data.selfSigned,
                                    channels: data.channels,
                                    nick: data.nick,
                                    password: data.password,
                                    encoding: data.encoding,
                                    keepAlive: data.keepAlive});
                                    
        conn.save();
        connections[current_user.username] = connection;
      }
    } else {
      if(!connection.keepAlive) {
        connection.connect();
      }
      socket.emit('restore_connection', {nick: connection.client.nick,
        server: connection.client.opt.server, channels: connection.client.chans});
      connection.clearUnreads();*/
  });

  socket.on('join', function(name) {
    /*if (name[0] != '#')
      name = '#' + name;
      
    connection.client.join(name);*/
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
    /*connection.client.say(data.target, data.message);
    socket.emit('message', {to:data.target.toLowerCase(), from: connection.client.nick, text:data.message});
    if(current_user){
      connection.logMessage(data.target, connection.client.nick, data.message);
    }*/
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