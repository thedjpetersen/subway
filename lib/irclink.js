var irc = require('irc');


// constructor
module.exports = function IRCLink(connID, app) {
  // are we connected?
  this.connected = false;
  this.created = new Date();

  // establish db models
  var User            = app.db.models.User;
  var Connection      = app.db.models.Connection;
  var Message         = app.db.models.Message;
  var PrivateMessage  = app.db.models.PM;
  var Channel         = app.db.models.Channel;

  var instance = this;

  // find the connection ID in the db and wake it up
  Connection.find(connID, function (err, userConn) {
    // that's not good, give up
    if (err || userConn === null)
      return;

    Channel.all({where: {conn_id: connID}}, function (err, userChans) {
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
        secure: userConn.ssl.valueOf(),
        selfSigned: userConn.selfSigned,
        encoding: userConn.encoding,
        certExpired: false,
        stripColors: userConn.stripColors
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
        if (!userConn.temporary.valueOf()) {
          Message.create({
            conn_id: connID
            , by: from
            , chan: to
            , at: Date.now()
            , msg: msg
          });
        }
      };

      instance.logPM = function(from, msg) {
        if (!userConn.temporary.valueOf()) {
          PrivateMessage.create({
            conn_id: connID
            , by: from
            , at: Date.now()
            , msg: msg
          });
        }
      };

      instance.incrementUnread = function(channel) {
        try {
          instance.client.chans[channel.toLowerCase()].unread_messages++;
        } catch (err) {}
      };

      instance.incrementMention = function(channel) {
        try {
          instance.client.chans[channel.toLowerCase()].unread_mentions++;
        } catch (err) {}
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
        'channellist': ['channelList'],
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
              // create unread/mention count on channel object
              var clientChan = instance.client.chans[args.channel.toLowerCase()];
              if (clientChan !== undefined) {
                clientChan.unread_messages = 0;
                clientChan.unread_mentions = 0;
              }
              // add to db for connection
              Channel.count({conn_id: connID, name: args.channel.toLowerCase()}, function (err, count) {
                if (count === 0) {
                  Channel.create({
                    conn_id: connID
                    , name: args.channel.toLowerCase()
                  });
                }
              });
              break;
            case 'part':
              // remove from db for connection
              Channel.findOne({where: {conn_id: connID, name: args.channel.toLowerCase()}}, function (err, chan) {
                // boom
                if (!err && chan)
                  chan.destroy();
              });
              break;
            case 'message#':
              // increment unread message and mention counts
              instance.incrementUnread(args.to);
              
              var re = new RegExp('\\b' + instance.client.nick.toLowerCase() + '\\b', 'g');
              if(re.test(args.text.toLowerCase())){
                instance.incrementMention(args.to);
              }
              // log it
              instance.logMessage(args.from, args.to, args.text);
              break;
            case 'action':
              // increment unread message and mention counts
              instance.incrementUnread(args.to);
              
              var re = new RegExp('\\b' + instance.client.nick.toLowerCase() + '\\b', 'g');
              if(re.test(args.text.toLowerCase())){
                instance.incrementMention(args.to);
              }
              // log it
              instance.logMessage(args.from, args.to, '\u0001ACTION ' + args.text);
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
              for(chan in instance.client.chans){
                try {
                  instance.client.chans[chan].unread_messages = 0;
                  instance.client.chans[chan].unread_mentions = 0;
                } catch (err) {}
              }
              break;
            case 'part':
              instance.client.part(data.channel.toLowerCase());
              break;
            case 'action':
              instance.client.action(data.target.toLowerCase(), data.message);
              instance.xmitEvent('message#', {to: data.target.toLowerCase(), from: instance.client.nick, text: '\u0001ACTION ' + data.message});
              // log it
              instance.logMessage(instance.client.nick, data.target.toLowerCase(), '\u0001ACTION ' + data.message);
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
            case 'list':
              instance.client.list(instance.client.opt.server);
              break;
            default:
              break;
          }
        }
      });
    });
  });
}
