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

  irc.socket.on('join', function(data) {
      console.log('Join event received for ' + data.channel + ' - ' + data.nick);
      if (data.nick == irc.me['nick']) {
          irc.chatWindows.add({name: data.channel});
      } else {
          channel = irc.chatWindows.getByName(data.channel);
          channel.participants.add({nick: data.nick});
          var joinMessage = new Message({type: 'join', nick: data.nick});
          joinMessage.setText();
          channel.stream.add(joinMessage);
      }
  });

})

