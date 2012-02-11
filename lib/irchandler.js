var irc = require('irc'),
  bcrypt = require('bcrypt'),
  mongoose = require('mongoose');

Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  password: String
});

var clients = [];

var User = mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/my_database');

var irchandler = exports.irchandler = function(socket) {
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
    'netError': ['message'],
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
      });
    });
  });

  socket.on('login', function(data){
    console.log(data);
    User.find({}, function(err, docs) { console.log(docs); });
    User.findOne({username: data.username}, function(err, user) {
      console.log(user);
      bcrypt.compare(data.password, user.password, function(err, res) {
        socket.emit('loginStatus', {res: res});
        if(res === true){
          //client.logged_in = true;
          console.log('logged in');
        } else {
          console.log('Wrong password');
        }
      });
    });
  });

  socket.on('connect', function(data) {
    var client = new irc.Client(data.server, data.nick, {
      debug: true,
      logged_in: false,
      showErrors: true,
      channels: data.channels,
      userName: 'subway',
      realName: 'Subway IRC client'
    });


    // Socket events sent FROM the front-end
    socket.on('join', function(name) { client.join(name); });
    socket.on('part', function(name) { client.part(name); });
    socket.on('say', function(data) {
      client.say(data.target, data.message);
      socket.emit('message', {to:data.target, from: client.nick, text:data.message})
    });

    socket.on('action', function(data) {
      client.action(data.target, data.message);
      socket.emit('message', {to:data.target, from: client.nick,
        text:'\u0001ACTION ' + data.message})
    });

    socket.on('getNick', function(data) {
      socket.emit('getNick', {nick: client.nick});
    });

    socket.on('command', function(text) { console.log(text); client.send(text); });
    socket.on('disconnect', function() { client.disconnect(); });


    // Add a listener on client for the given event & argument names
    var activateListener = function(event, argNames) {
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
    console.log('Starting IRC client; wiring up socket events.')
  });
}
