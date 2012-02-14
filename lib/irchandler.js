var irc = require('irc'),
  bcrypt = require('bcrypt'),
  mongoose = require('mongoose');

Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: { type: String , index: {unique: true}},
  password: String
});

var clients = {};

var User = mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/my_database');

var irchandler = exports.irchandler = function(socket) {
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

  socket.on('register', function(data) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(data.password, salt, function(err, hash) {
          // Store hash in your password DB.
          var user = new User();
          user.username = data.username;
          user.password = hash;
          user.save();
          console.log(user);
          socket.emit('register_success', {username: user.username});
          current_user = user;
      });
    });
  });

  socket.on('login', function(data){
    User.findOne({username: data.username}, function(err, user) {
      console.log(user);
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
        debug: true,
        logged_in: false,
        showErrors: true,
        channels: data.channels,
        userName: 'subway',
        realName: 'Subway IRC client'
      });

      if(current_user){
        clients[current_user.username] = client;
      }
    } else {
      socket.emit('restore_connection', {nick: client.nick,
        server: client.opt.server, channels: client.chans});
    }

    // Socket events sent FROM the front-end
    socket.on('join', function(name) { client.join(name); });
    socket.on('part', function(name) { client.part(name); });
    socket.on('say', function(data) {
      client.say(data.target, data.message);
      socket.emit('message', {to:data.target, from: client.nick, text:data.message});
    });

    socket.on('action', function(data) {
      client.action(data.target, data.message);
      socket.emit('message', {
        to: data.target,
        from: client.nick,
        text: '\u0001ACTION ' + data.message}
      );
    });

    socket.on('command', function(text) { console.log(text); client.send(text); });

    socket.on('disconnect', function() {
      if(!current_user){
        client.disconnect();
      }
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
      });
    };

    for (var event in events) { activateListener(event, events[event]); }
    console.log('Starting IRC client; wiring up socket events.');
  });
}
