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
    irc.socket.emit('getNick', {});
    irc.connected = true;
    irc.appView.render();
    irc.chatWindows.add({name: 'status', type: 'status'});
    irc.chatWindows.getByName('status').stream.add({sender: '', raw: data.message, type: 'status'});
  });

  irc.socket.on('notice', function(data) {
    //TODO: make this work
    //irc.chatWindows.getByName('status').stream.add({sender: 'notice', raw: data.text, type: 'notice'});
  });

  irc.socket.on('nick', function(data) {
    irc.me.nick = data.nick;
  });

  // Message of the Day
  irc.socket.on('motd', function(data) {
    var message = new Message({sender: 'status', raw: data.motd, type: 'motd' });
    irc.chatWindows.getByName('status').stream.add(message);
  });

  irc.socket.on('message', function(data) {
    var chatWindow = irc.chatWindows.getByName(data.to);
    var type = 'message';
    if (data.to.substr(0) !== '#'){
      //We do this in the case of a private message
      type = 'pm';
    }
    chatWindow.stream.add({sender: data.from, raw: data.text, type: type});
  });

  irc.socket.on('pm', function(data) {
    var chatWindow = irc.chatWindows.getByName(data.nick);
    if (chatWindow === undefined){
      irc.chatWindows.add({name: data.nick});
      chatWindow = irc.chatWindows.getByName(data.nick);
    }
    chatWindow.stream.add({sender: data.nick, raw: data.text, type: 'pm'});
  });

  irc.socket.on('join', function(data) {
    console.log('Join event received for ' + data.channel + ' - ' + data.nick);
    if (data.nick === irc.me.nick) {
      irc.chatWindows.add({name: data.channel});
    } else {
      var channel = irc.chatWindows.getByName(data.channel);
      channel.userList.add({nick: data.nick, role: data.role, idle:0, user_status: 'active', activity: 'Joined'});
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
      var user = channel.userList.getByNick(data.nick);
      user.view.remove();
      user.destroy();
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

  irc.socket.on('error', function(data) {
    console.log(data.messsage);
  });

  irc.socket.on('netError', function(data) {
    console.log(data);
  });

  irc.handleCommand = function(commandText) {
    switch(commandText[0]) {
      case '/join':
        irc.socket.emit('join', commandText[1]);
        break;
      case '/part':
        if(commandText[1]){
          irc.socket.emit('part', commandText[1]);
          irc.appView.channelList.channelTabs[0].setActive();
        } else {
          irc.socket.emit('part', irc.chatWindows.getActive().get('name'));
          irc.appView.channelList.channelTabs[0].setActive();
        }
        break;
      case '/me':
        irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:'\u0001ACTION ' + commandText.splice(1).join(" ")});
        break;
      default:
        irc.socket.emit('command', commandText);
    }
  }

})

