var irc = require('irc');

var irchandler = exports.irchandler = function(socket) {
  // Events to signal TO the front-end
  var events = {
    'join': ['channel', 'nick'],
    'part': ['channel', 'nick'],
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

  socket.on('connect', function(data) {
    var client = new irc.Client(data.server, data.nick, {
      debug: true,
      showErrors: true,
      channels: data.channels
    });


    // Socket events sent FROM the front-end
    socket.on('join', function(name) { client.join(name); });
    socket.on('part', function(name) { client.part(name); });
    socket.on('say', function(data) {
      client.say(data.target, data.message);
      socket.emit('message', {to:data.target, from: client.nick, text:data.message})
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
