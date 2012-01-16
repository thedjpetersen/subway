//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.7.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/ICanHaz.min.js'
//= require 'models.js'
//= require 'collections.js'
//= require_tree 'views'


// Global object
window.irc = {
  socket: io.connect(),
  chatWindows: new WindowList,
  connected: false
};

// This isn't doing us any favors yet.
// var ChatApplicationRouter = Backbone.Router.extend({
//   initialize: function(options) {
//     this.view = new ChatApplicationView;
//   }
// });


$(function() {
  // window.app = new ChatApplicationRouter;
  irc.appView = new ChatApplicationView;


  // EVENTS //

  // Registration (server joined)
  irc.socket.on('registered', function(data) {
    irc.connected = true;
    irc.appView.render();
    irc.chatWindows.add({name: 'status', type: 'status'});
    irc.chatWindows.getByName('status').stream.add({sender: '', raw: data.message});
  });

  // Message of the Day
  irc.socket.on('motd', function(data) {
    data.motd.split('\n').forEach(function(line) {
      irc.chatWindows.getByName('status').stream.add({sender: '', raw: line});
    });
  });

  irc.socket.on('message', function(data) {
    irc.chatWindows.getByName(data.to).stream.add({sender: data.from, raw: data.text});
  });

  irc.socket.on('join', function(data) {
    console.log('Join event received for ' + data.channel + ' - ' + data.nick);
    if (data.nick === irc.me.nick) {
      irc.chatWindows.add({name: data.channel});
    } else {
      var channel = irc.chatWindows.getByName(data.channel);
      channel.participants.add({nick: data.nick});
      var joinMessage = new Message({type: 'join', nick: data.nick});
      joinMessage.setText();
      channel.stream.add(joinMessage);
    }
  });

  irc.socket.on('part', function(data) {
    console.log('Part event received for ' + data.channel + ' - ' + data.nick);
    var channel = irc.chatWindows.getByName(data.channel);
    if (data.nick === irc.me.nick) {
      channel.part();
    } else {
      channel.participants.getByNick(data.nick).destroy();
      var partMessage = new Message({type: 'part', nick: data.nick});
      partMessage.setText();
      channel.stream.add(partMessage);
    }
  });

  irc.socket.on('names', function(data) {
    var channel = irc.chatWindows.getByName(data.channel);
    channel.userList = new UserList(channel);
    $.each(data.nicks, function(nick, role){
      channel.userList.add(new User({nick: nick, role: role, idle:0, user_status: 'active', activity: 'Joined'}))
    });
  });

  irc.socket.on('topic', function(data) {
    var channel = irc.chatWindows.getByName(data.channel);
    channel.set({topic: data.topic});
  });

  irc.handleCommand = function(commandText) {
    irc.socket.emit('command', commandText);
    // switch(commandText[0]) {
    //   case 'join':
    //     irc.socket.emit('join', commandText[1]);
    //     break;
    //   case 'part':
    //     irc.socket.emit('part', commandText[1]);
    //     break;
    // }
  }

})

