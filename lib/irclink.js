var irc = require('irc');


// Constructor
module.exports = function IRCLink(connID, app) {
  // Are we connected?
  this.connected = false;
  this.created = new Date();

  // establish db models
  var User        = app.db.models.user;
  var Connection  = app.db.models.connection;
  var Message     = app.db.models.message;
  var PM          = app.db.models.pm;
  var Channel     = app.db.models.channel;

  // Hold our reference
  var instance = this;

  // Find the connection ID in the db and wake it up
  Connection.findById(connID, function (err, userConn) {
    // that's not good, give up
    if (err || userConn === null)
      return;

    // make sure this is reasonable
    try {
      instance.port = parseInt(port);
      if (isNaN(instance.port) || instance.port < 1024 || instance.port > 65535)
        instance.port = 6667;
    } catch (pErr) {
      instance.port = 6667;
    }

    if (userConn.server_password && userConn.server_password.length > 0)
      instance.srvPassword = userConn.server_password;
    else
      instance.srvPassword = null;

    if (userConn.server_username && userConn.server_username.length > 0)
      instance.srvUsername = userConn.server_username;
    else
      instance.srvUsername = userConn.nick;

    if (userConn.real_name && userConn.real_name.length > 0)
      instance.realName = userConn.real_name;
    else
      instance.realName = userConn.nick;

    instance.client = new irc.Client(userConn.hostname, userConn.nick, {
      password: instance.srvPassword,
      userName: instance.srvUsername,
      realName: instance.realName,
      port: instance.port,
      autoRejoin: false,
      floodProtection: true,
      secure: userConn.ssl,
      selfSigned: userConn.selfSigned,
      encoding: encoding,
      certExpired: false,
      floodProtection: true,
      floodProtectionDelay: 1000,
      stripColors: true
    });

    // add ourself as a connection
    app.ircConnectionArray.push(connID);

    // Send an event to any connected clients
    instance.xmitEvent = function(event, dict) {
      // dictionary is optional
      var dict = (typeof dict === "undefined") ? {} : dict;
      // always add connection ID to event payloads
      dict['connId'] = connID;
      // blast out the event name to the user's room with the payload attached
      app.io.sockets.in(userConn.user_id).emit(event, dict);
    };

    instance.events = {
      'connect': ['message'],
      'registered': ['message'],
      'motd': ['motd'],
      'names': ['channel', 'nicks'],
      'topic': ['channel', 'topic', 'nick'],
      'join': ['channel', 'nick', 'message'],
      'part': ['channel', 'nick', 'message'],
      'quit': ['nick', 'reason', 'channels', 'message'],
      'kick': ['channel', 'nick', 'by', 'reason'],
      'kill': ['nick', 'reason', 'channels', 'message'],
      'message#': ['from', 'to', 'text'],
      'action': ['from', 'to', 'text'],
      'notice': ['nick', 'to', 'text'],
      'ping': [],
      'pm': ['nick', 'text'],
      'nick': ['oldNick', 'newNick', 'channels'],
      'invite': ['channel', 'from'],
      '+mode': ['channel', 'by', 'mode', 'argument'],
      '-mode': ['channel', 'by', 'mode', 'argument'],
      'whois': ['info'],
      'error': ['message'],
      'close': []      
    };

    // Add a listener on client for the given event & argument names
    instance.activateListener = function(event, argNames) {
      instance.client.addListener(event, function() {
        // Associate specified names with callback arguments
        var callbackArgs = arguments;
        var args = {};
        argNames.forEach(function(arg, index) {
          args[arg] = callbackArgs[index];
        });
      
        // emit events to any connected clients
        instance.xmitEvent(event, args);

        // special cases
        switch (event) {
          case 'connect':
            instance.connected = true;
            // TODO: set timeout for nickserv
            // TODO: set timeout for channel join
            break;
          case 'join':
            // TODO: add to db for channels joined
            break;
          case 'part':
            // TODO: remove from db for channels joined
            break;
          case 'message#':
            // TODO: LOG THIS
            break;
          case 'action':
            // TODO: LOG THIS
            break;
          case 'nick':
            // TODO: update db model with user's new nick (if theirs changed)
            break;
          case 'pm':
            // TODO: LOG THIS
            break;
          case 'ping':
            // TODO: update last seen timestamp in db
            break;
          case 'close':
            instance.connected = false;
            app.ircConnectionArray.splice(app.ircConnectionArray.indexOf(connID), 1);
            break;
          default:
            break;
        }
      });
    };

    for (var event in instance.events) {
      instance.activateListener(event, this.events[event]);
    }
      
    // Handle requests from user
    app.ircbridge.on(connID, function(event, data) {
      if (instance.connected) {
        switch (event) {
          case 'say':
            instance.client.say(data.to.toLowerCase(), data.text);
            // log it
            var msg = new Message({conn_id: connID, from: instance.client.nick, chan: data.to.toLowerCase(), msg: data.text});
            msg.save();
            break;
          case 'join':
            instance.client.join(data.channel.toLowerCase());
            break;
          case 'clearunreads':
            // TODO!
            break;
          case 'part':
            instance.client.part(data.channel.toLowerCase());
            break;
          case 'action':
            instance.client.action(data.to.toLowerCase(), data.text);
            break;
          case 'whois':
            instance.client.whois(data.to.toLowerCase());
            break;
          case 'topic':
            instance.client.send('TOPIC', data.to.toLowerCase(), data.topic);
            break;
          case 'nick':
            instance.client.send('NICK', data.nick);
            break;
          case 'get_channels':
            var chanArray = new Array();
            for (var key in instance.client.chans) {
              chanArray.push(key);
            }
            instance.xmitEvent('channels', {'channels':chanArray});
            break;
          case 'get_channel_details':
            if (data.channel.toLowerCase() in instance.client.chans) {
              var response = {
                "channel": data.channel.toLowerCase(),
                "topic": instance.client.chans[data.channel.toLowerCase()].topic,
                "topic_by": instance.client.chans[data.channel.toLowerCase()].topicBy,
                "created": instance.client.chans[data.channel.toLowerCase()].created,
                "modes": instance.client.chans[data.channel.toLowerCase()].mode,
                "userlist": instance.client.chans[data.channel.toLowerCase()].users
              };

              instance.xmitEvent('channel_details', {'channel':response.channel,'topic':response.topic,'topic_by':response.topic_by,'modes':response.modes,'userlist':response.userlist});
            }
            break;
          case 'disconnect':
            if (instance.connected) {
              instance.connected = false;
              // TODO: disable this connection
              instance.client.disconnect();
              // remove ourselves from the IRC connection array
              app.ircConnectionArray.splice(app.ircConnectionArray.indexOf(connID), 1);
            }
            break;
          case 'away':
            instance.client.send('AWAY', data.text);
            break;
          default:
            break;
        }
      }
    });
  });
}