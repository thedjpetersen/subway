module.exports = function(socket, app) {
  // once we are authed, this will no longer be null
  socket.user = null;

  // establish models
  var User = app.db.model('User');
  var Connection = app.db.model('Connection');
  var Message = app.db.model('Message');
  var PrivateMessage = app.db.model('PrivateMessage');
  var Channel = app.db.model('Channel');

  /* success, fail, util */
  socket.fail = function(cb, reason) {
    var resp = {
      'success': false,
      'reason': reason
    };
    cb(resp);
  }
  socket.succeed = function(cb, dict) {
    dict['success'] = true;
    cb(dict);
  }
  socket.xmitEvent = function(connection, event, dict) {
    // TODO: only allow xmit to connections belonging to the user
    // TODO: send back fail for all xmitEmit calls if connection is not online
    app.ircbridge.emit(connection, event, dict);
  }
  socket.generateIdent = function(len) {
    var len = len || 10; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i=0; i < len; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
    return s;
  }

  // TODO: lock down queries to only return connections that belong to user
  // TODO: idiot proof data inputs

  /* auth commands */
  socket.on('fb_auth', function (data, cb) {

    if (data.token === undefined) {
      socket.fail(cb, 'no_fb_token');
      return;
    }

    var facebook_client = new FacebookClient(
        app.conf.facebook.appid, // configure like your fb app page states
        app.conf.facebook.appsecret, // configure like your fb app page states
        {
            "timeout": 5000 // modify the global timeout for facebook calls (Default: 10000)
        }
    );

    facebook_client.getSessionByAccessToken(data.token)(function(facebook_session) {
        facebook_session.graphCall("/me",
        {'fields':'id,first_name,last_name'})(
        function(result) {
            if (result.error !== undefined) {
              socket.fail(cb, 'invalid_token');
            } else {
              socket.succeed(cb, result);

              User.findOne({ fb_uid: result.id }, function (err, doc){
                // register the user if need be
                if (doc === null) {
                  var user = new User({fb_uid: result.id, ident: 'uid'+socket.generateIdent(6)});
                  user.save();
                  socket.user = user;
                  // subscribe to all future IRC connections
                  socket.join(socket.user._id);
                } else {  // user already exists
                  socket.user = doc;
                  // subscribe to all online IRC connections
                  socket.join(socket.user._id);
                }
              });
            }
        });
    });
  });


  /* connection commands */
  socket.on('create_connection', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    var conn = new Connection({user_id: socket.user.id, label: data.label, 
      hostname: data.hostname, port: data.port, nick: data.nick, 
      ssl: data.ssl, server_password: data.server_password, nickserv_password: data.nickserv_password,
      nickserv_enabled: data.nickserv_enabled, real_name: data.real_name});

    conn.save(function (err) {
      if (!err) {
        socket.succeed(cb, {connId: conn.id});
      }
      else {
        socket.fail(cb, 'invalid_connection');
      }
    });
  });

  socket.on('edit_connection', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    Connection.findByIdAndUpdate(data.connId, {user_id: socket.user.id, label: data.label, 
      hostname: data.hostname, port: data.port, nick: data.nick, 
      ssl: data.ssl, server_password: data.server_password, nickserv_password: data.nickserv_password,
      nickserv_enabled: data.nickserv_enabled, real_name: data.real_name}, function (err, doc) {
      if (err) {
        socket.fail(cb, 'invalid_connection');
      } else {
        socket.succeed(cb, {connId: data.connId});
      }
    });
  });

  socket.on('remove_connection', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    Connection.findByIdAndRemove(data.connId, function (err, doc) {
      if (err) {
        socket.fail(cb, 'invalid_connection');
      } else {
        socket.succeed(cb, {connId: data.connId});
      }
    });
  });

  socket.on('connection_go_online', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    Connection.findByIdAndUpdate(data.connId, {disabled: false, disabled_reason: 'N/A'}, function (err, doc) {
      if (err) {
        socket.fail(cb, 'invalid_connection');
      } else {
        socket.succeed(cb, {connId: data.connId});
        // tell the backend to spin up an IRC session
        app.ircbridge.emit('create_irclink', data.connId);
      }
    });
  });

  socket.on('connection_go_offline', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    Connection.findByIdAndUpdate(data.connId, {disabled: true, disabled_reason: 'User initiated.'}, function (err, doc) {
      if (err) {
        socket.fail(cb, 'invalid_connection');
      } else {
        socket.succeed(cb, {connId: data.connId});
        // send redis kill command to terminate session
        app.ircbridge.emit(data.connId, 'disconnect', {});
      }
    });
  });

  socket.on('get_connections', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    Connection.find({user_id: socket.user.id}, function (err, docs){
      var conns = [];
      if (err == null) {
        // report connection status for each connection
        for (var i=0; i<docs.length; i++) {
          var doc = docs[i].toObject();
          doc.online = false;
          if (app.ircConnectionArray.indexOf(doc._id.toString()) !== -1)
            doc.online = true;
          conns.push(doc);
        }

        socket.succeed(cb, {connnections: conns});
      }
      else
        socket.fail(cb, 'server_error');
    });
  });


  /* IRC connection commands */
  socket.on('join', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'join', {'channel': data.channel});
    socket.succeed(cb, {});
  });

  socket.on('part', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'part', {'channel': data.channel});
    socket.succeed(cb, {});
  });

  socket.on('say', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'say', {'to': data.to, 'text': data.text});
    socket.succeed(cb, {});
  });

  socket.on('action', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'action', {'to': data.to, 'text': data.text});
    socket.succeed(cb, {});
  });

  socket.on('whois', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'whois', {'to': data.to});
    socket.succeed(cb, {});
  });

  socket.on('topic', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'topic', {'to': data.to, 'topic': data.topic});
    socket.succeed(cb, {});
  });

  socket.on('nick', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'nick', {'nick': data.nick});
    socket.succeed(cb, {});
  });

  socket.on('get_log', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.fail(cb, 'not_implemented');
  });

  socket.on('get_private_messages', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.fail(cb, 'not_implemented');
  });



  socket.on('get_channels', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'get_channels', {});
    socket.succeed(cb, {});
  });



  socket.on('get_channel_details', function (data, cb) {
    if (socket.user == null) {
      socket.fail(cb, 'not_authed');
      return;
    }

    socket.xmitEvent(data.connId, 'get_channel_details', {'channel': data.channel});
    socket.succeed(cb, {});
  });


  /* socket connection events */
  socket.on('disconnect', function() {
    // remove the socket from the sockets array
    app.connectedSockets.splice(app.connectedSockets.indexOf(socket.id), 1);
  });

}