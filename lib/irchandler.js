var irc = require('irc'),
  bcrypt = require('bcrypt'),
  mongoose = require('mongoose');

var User = mongoose.model('User');
var Connection = mongoose.model('Connection');
var Channel = mongoose.model('Channel');
var Message = mongoose.model('Message');

var log_message = function(username, channelName, channelServer, msg_object) {
  Channel.findOne({name: channelName.toLowerCase(), user: username}, function(err, channel) {
    if(!channel){
      var channel = new Channel({name: channelName.toLowerCase(), server: channelServer.toLowerCase(), user: username});
    }
    channel.messages.push(msg_object);
    channel.save();
  });
};

var clear_unreads = function(channels){
  for(key in channels){
    if(channels.hasOwnProperty(key)){
      var channel = channels[key];
      channel.unread_messages = 0;
      channel.unread_mentions = 0;
    }
  }
};



var irchandler = exports.irchandler = function(socket, app, clients) {
  this.app = app;

  var current_user;
  // Events to signal TO the front-end
  var events = {
    'join': ['channel', 'nick'],
    'part': ['channel', 'nick'],
    'quit': ['nick', 'reason', 'channels', 'message'],
    'topic': ['channel', 'topic', 'nick'],
    'nick': ['oldNick', 'newNick', 'channels'],
    'names': ['channel', 'nicks'],
    'message': ['from', 'to', 'text'],
    '+mode': ['channel', 'by', 'mode', 'argument', 'message'],
    '-mode': ['channel', 'by', 'mode', 'argument', 'message'],
    'notice': ['nick', 'to', 'text', 'message'],
    'pm': ['nick', 'text'],
    'registered': ['message'],
    'motd': ['motd'],
    'error': ['message'],
    'netError': ['message']
  };

  socket.on('getDatabaseState', function(){
    socket.emit('databaseState', {state: mongoose.connection.readyState});
  });
  
  socket.on('register', function(data) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(data.password, salt, function(err, hash) {
          // Store hash in your password DB.
          var user = new User();
          user.username = data.username;
          user.password = hash;
          user.save();
          socket.emit('register_success', {username: user.username});
          current_user = user;
      });
    });
  });

  socket.on('login', function(data){
    User.findOne({username: data.username}, function(err, user) {
      if(user){
        bcrypt.compare(data.password, user.password, function(err, res) {
          if(res === true){
            var exists;
            //client.logged_in = true;
            current_user = user;
            if(clients[user.username] !== undefined){
              exists = true;
            } else {
              exists = false;
            }
            socket.emit('login_success', {username: user.username, exists: exists});
            console.log('logged in');
          } else {
            socket.emit('login_error', {message: 'Wrong password'});
            console.log('Wrong password');
          }
        });
      } else {
        socket.emit('login_error', {message: 'No user found'});
        console.log('No user found');
      }
    });
  });

  socket.on('connect', function(data) {
    var client;
    if(current_user){
      client = clients[current_user.username];
    }
    if(client === undefined) {
      client = new irc.Client(data.server, data.nick, {
        port: data.port || (data.secure ? 6697 : 6667),
        password: data.password,
        secure: data.secure,
        selfSigned: data.selfSigned,
        debug: false,
        showErrors: false,
        channels: data.channels,
        userName: 'subway',
        realName: 'Subway IRC client'
      });
      
      // save this connection
      if(current_user){
        var conn = new Connection({ user: current_user.username,
                                    hostname: data.server,
                                    port: data.port || (data.secure ? 6697 : 6667),
                                    ssl: data.secure,
                                    selfSigned: data.selfSigned,
                                    channels: data.channels,
                                    nick: data.nick,
                                    password: data.password });
        conn.save();
        clients[current_user.username] = client;
      }
    } else {
      socket.emit('restore_connection', {nick: client.nick,
        server: client.opt.server, channels: client.chans});
      clear_unreads(client.chans);
    }
    
    // Socket events sent FROM the front-end
    socket.on('join', function(name) {
      if (name[0] != '#')
        name = '#' + name;
        
      client.join(name);
    });

    socket.on('part_pm', function(name){
      if(client.chans[name.toLowerCase()] !== undefined){
        delete client.chans[name.toLowerCase()];
      }
    });

    socket.on('part', function(name) {
      if (name[0] != '#')
        name = '#' + name;
      
      client.part(name);
      if(current_user){
        // update the user's connection / channel list
        Connection.update({ user: current_user.username }, { $pull: { channels: name.toLowerCase() } }, function(err) {
          if (err) {
            // handle error
          }
        });
      }
    });

    socket.on('say', function(data) {
      client.say(data.target, data.message);
      socket.emit('message', {to:data.target.toLowerCase(), from: client.nick.toLowerCase(), text:data.message});
      if(current_user){          
        log_message(current_user.username, data.target, client.opt.server, {user: client.nick, message: data.message});
      }
    });

    socket.on('action', function(data) {
      client.action(data.target, data.message);
      socket.emit('message', {
        to: data.target.toLowerCase(),
        from: client.nick.toLowerCase(),
        text: '\u0001ACTION ' + data.message}
      );
    });

    socket.on('topic', function(data){
      client.send('TOPIC ', data.name, data.topic);
    });

    socket.on('nick', function(data){
      client.send('NICK', data.nick);
      client.nick = data.nick.toLowerCase();
      client.opt.nick = client.nick;
    });

    socket.on('command', function(text) { console.log(text); client.send(text); });

    socket.on('disconnect', function() {
      if(!current_user){
        client.disconnect();
      } else {
        clear_unreads(client.chans);
      }
    });

    socket.on('getOldMessages', function(data){
      Channel.find({name: data.channelName.toLowerCase(), server: client.opt.server.toLowerCase(), user: current_user.username},
                   {messages: {$slice: [data.skip, data.amount]}},
        function(err, results) {
          if(results){
            if(results[0]){
              results[0]['name'] = data.channelName.toLowerCase();
            }
            socket.emit('oldMessages', results[0]);
          }
      });
    });

    // Add a listener on client for the given event & argument names
    var activateListener = function(event, argNames) {
      //remove duplicate events
      client.listeners(event).forEach(function(item){
        client.removeListener(event, item);
      });
      client.addListener(event, function() {
        console.log('Event ' + event + ' sent');
        // Associate specified names with callback arguments
        // to avoid getting tripped up on the other side
        var callbackArgs = arguments;
        args = {};
        argNames.forEach(function(arg, index) {
            args[arg] = callbackArgs[index];
        });
        console.log(args);
        socket.emit(event, args);

        // This is the logic on what to do on a recieved message
        if(event == 'message'){
          if(current_user){
            var target;
            if (args.to[0] != '#')
              target = args.from.toLowerCase();
            else
              target = args.to.toLowerCase();
              
            log_message(current_user.username, target, client.opt.server, {user: args.from, message: args.text});
            
            if(client.chans[target] === undefined){
              client.chans[target] = {serverName: target,
                unread_messages: 0, unread_mentions: 0};
            }
            
            if(socket.disconnected){
              client.chans[target].unread_messages++;
              
              var re = new RegExp('\\b' + client.nick.toLowerCase() + '\\b', 'g');
              if(re.test(args.text)){
                client.chans[target].unread_mentions++;
              }
            }
          }
        }
        
        // This is the logic to assign a user to log messages on join
        if(event == 'join') {
          if(current_user){
            // update the user's channel list
            Connection.update({ user: current_user.username }, { $addToSet: { channels: args.channel.toLowerCase() } }, function(err) {
              // handle error
            });
          }
        }

      });
    };

    for (var event in events) { activateListener(event, events[event]); }
    console.log('Starting IRC client; wiring up socket events.');
  });
}
