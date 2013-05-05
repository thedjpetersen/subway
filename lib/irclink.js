var irc = require('irc');


// constructor
module.exports = function IRCLink(connID, app) {
  // are we connected?
  this.connected = false;
  this.created = new Date();

  // establish db models
  var User        = app.db.models.user;
  var Connection  = app.db.models.connection;
  var Message     = app.db.models.message;
  var PM          = app.db.models.pm;
  var Channel     = app.db.models.channel;

  // hold our reference
  var instance = this;

  // find the connection ID in the db and wake it up
  Connection.get(connID, function (err, userConn) {
    // that's not good, give up
    if (err || userConn === null)
      return;

    Channel.find({conn_id: connID}, function (err, userChans) {
      var channels = [];
      for (var i=0; i<userChans.length; i++) {
        channels.push(userChans[i].name);
      }

      if (app.config.debug) {
        console.log('Restoring connection '+connID+'...');
      }

      // make sure this is reasonable
      try {
        instance.port = parseInt(userConn.port);
        if (isNaN(instance.port) || instance.port < 1024 || instance.port > 65535)
          instance.port = 6667;
      } catch (pErr) {
        instance.port = 6667;
      }

      if (userConn.server_password && userConn.server_password.length > 0)
        instance.srvPassword = userConn.server_password;
      else
        instance.srvPassword = null;

      if (userConn.real_name && userConn.real_name.length > 0)
        instance.realName = userConn.real_name;
      else
        instance.realName = userConn.nick;

      instance.client = new irc.Client(userConn.hostname, userConn.nick, {
        password: instance.srvPassword,
        userName: userConn.nick,
        realName: instance.realName,
        port: instance.port,
        autoRejoin: false,
        channels: channels,
        floodProtection: true,
        secure: userConn.ssl,
        selfSigned: userConn.selfSigned,
        encoding: userConn.encoding,
        certExpired: false,
        stripColors: true
      });

      // add ourself as a connection
      app.ircConnectionArray.push(connID);

      // send an event to any connected clients
      instance.xmitEvent = function(event, dict) {
        // dictionary is optional
        var dict = (typeof dict === "undefined") ? {} : dict;
        // always add connection ID to event payloads
        dict['connId'] = connID;
        // blast out the event name to the user's room with the payload attached
        app.io.sockets.in(userConn.user_id).emit(event, dict);
      };

      instance.logMessage = function(from, to, msg) {
        if (!userConn.temporary) {
          Message.create([{
            conn_id: connID
            , from: from
            , chan: to
            , at: Date.now()
            , msg: msg
          }], function (err, items) {});
        }
      };

      instance.logPM = function(from, msg) {
        if (!userConn.temporary) {
          PrivateMessage.create([{
            conn_id: connID
            , from: from
            , at: Date.now()
            , msg: msg
          }], function (err, items) {});
        }
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

      // add a listener on client for the given event & argument names
      instance.activateListener = function(event, argNames) {
        instance.client.addListener(event, function() {
          // associate specified names with callback arguments
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
              if(instance.client.chans[args.channel] === undefined)
                instance.client.chans[args.channel] = {unread_messages: 0, unread_mentions: 0};
              // add to db for connection
              Channel.count({conn_id: connID, name: args.channel.toLowerCase()}, function (err, count) {
                if (count === 0) {
                  Channel.create([{
                    conn_id: connID
                    , name: args.channel.toLowerCase()
                  }], function (err, items) {});
                }
              });
              break;
            case 'part':
              if(instance.client.chans[args.channel] !== undefined)
                delete instance.client.chans[args.channel]
              // remove from db for connection
              Channel.find({conn_id: connID, name: args.channel.toLowerCase()}).remove(function (err) {
                // boom
              });
              break;
            case 'message#':
              // check if any clients are connected to this IRC link
              if(app.ircbridge.listeners(connID).length === 0){
                // if not, increment unread message and mention counts
                instance.client.chans[args.to].unread_messages++;
                
                var re = new RegExp('\\b' + instance.client.nick.toLowerCase() + '\\b', 'g');
                if(re.test(args.text.toLowerCase())){
                  instance.client.chans[args.to].unread_mentions++;
                }
              }
              // log it
              instance.logMessage(args.from, args.to, args.text);
              break;
            case 'nick':
              if (args.oldNick === userConn.nick) {
                // TODO: update db model with user's new nick
              }
              break;
            case 'pm':
              // log it
              instance.logPM(args.nick, args.text);
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

      // setup all node-irc listeners declared above
      for (var event in instance.events) {
        instance.activateListener(event, instance.events[event]);
      }
        
      // Handle requests from user
      app.ircbridge.on(connID, function(event, data) {
        if (instance.connected) {
          switch (event) {
            case 'say':
              instance.client.say(data.to.toLowerCase(), data.text);
              instance.xmitEvent('message#', {to:data.to.toLowerCase(), from: instance.client.nick, text:data.text});
              // log it
              instance.logMessage(instance.client.nick, data.to.toLowerCase(), data.text);
              break;
            case 'join':
              instance.client.join(data.channel.toLowerCase());
              break;
            case 'restore':
              instance.xmitEvent('restore_connection', {nick: instance.client.nick,
                server: instance.client.opt.server, channels: instance.client.chans});
              break;
            case 'clearunread':
              // clear all unreads
              for(key in instance.client.chans){
                if(instance.client.chans.hasOwnProperty(key)){
                  var channel = instance.client.chans[key];
                  channel.unread_messages = 0;
                  channel.unread_mentions = 0;
                }
              }
              break;
            case 'part':
              instance.client.part(data.channel.toLowerCase());
              break;
            case 'part_pm':
              if(instance.client.chans[data.name.toLowerCase()] !== undefined){
                delete instance.client.chans[data.name.toLowerCase()];
              }
              break;
            case 'action':
              instance.client.action(data.target.toLowerCase(), data.message);
              instance.xmitEvent('message#', {to: data.target.toLowerCase(), from: instance.client.nick, text: '\u0001ACTION ' + data.message});
              break;
            case 'whois':
              instance.client.whois(data.nick.toLowerCase());
              break;
            case 'topic':
              instance.client.send('TOPIC', data.name, data.topic);
              break;
            case 'command':
              instance.client.send(data.command);
              break;
            case 'nick':
              instance.client.send('NICK', data.nick);
              break;
            case 'disconnect':
              if (instance.connected) {
                instance.connected = false;
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
  });
}