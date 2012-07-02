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


/* RECONNECT ALL SESSIONS HERE */
module.exports = function(app, clients) {
  this.app = app;
  
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
  
  Connection.find({},function(err, docs){
    docs.forEach(function(doc){
      var currentuser = {username: doc.user};
      
      var client = new irc.Client(doc.hostname, doc.nick, {
        port: doc.port || (doc.ssl ? 6697 : 6667),
        password: doc.password,
        secure: doc.ssl,
        selfSigned: doc.selfSigned,
        debug: false,
        showErrors: false,
        channels: [],
        userName: 'subway',
        realName: 'Subway IRC client'
      });
      
      clients[doc.user] = client;
      
      // rejoin all channels
      doc.channels.forEach(function(chan, index){
        setTimeout(function(){ client.join(chan); }, 15000 + (index * 1000));
      });
      
      // Add a listener on client for the given event & argument names
      var activateListener = function(event, argNames) {
        //remove duplicate events
        client.listeners(event).forEach(function(item){
          client.removeListener(event, item);
        });
        client.addListener(event, function() {
          // Associate specified names with callback arguments
          // to avoid getting tripped up on the other side
          var callbackArgs = arguments;
          args = {};
          argNames.forEach(function(arg, index) {
              args[arg] = callbackArgs[index];
          });

          // This is the logic on what to do on a recieved message
          if(event == 'message'){
            var target;
            if (args.to[0] != '#')
              target = args.from.toLowerCase();
            else
              target = args.to.toLowerCase();
              
            log_message(doc.user, target, doc.hostname, {user: args.from, message: args.text});
            
            if(client.chans[target] === undefined){
              client.chans[target] = {serverName: target,
                unread_messages: 0, unread_mentions: 0};
            }
            
            client.chans[target].unread_messages++;
            
            var re = new RegExp('\\b' + client.nick + '\\b', 'g');
            if(re.test(args.text)){
              client.chans[target].unread_mentions++;
            }
          }
        });
      };

      for (var event in events) { activateListener(event, events[event]); }
      
    });
  });
}