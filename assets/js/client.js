//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.7.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/ICanHaz.min.js'
//= require 'libs/bootstrap.min.js'
//= require 'utils.js'
//= require 'models.js'
//= require 'collections.js'
//= require_tree 'views'


// Websockets talk on port 80 on Nodester, regardless of listen port
if (ENV === 'production') PORT = 80;
window.irc = {
  socket: io.connect(null, {port: PORT}),
  chatWindows: new WindowList,
  connected: false
};

$(function() {
  // window.app = new ChatApplicationRouter;
  irc.appView = new ChatApplicationView;

  // EVENTS //

  // **TODO**: is there a better place for this to go?
  $(window).bind('beforeunload', function() {
    if(!window.irc.connected) { return null; }
    return "If you leave, you'll be signed out of Subway.";
  });

  irc.socket.emit('getDatabaseState', {});

  irc.socket.on('databaseState', function(data) {
    if(data.state === 0){
      $('#login, #register').hide();
    }
  });

  // Registration (server joined)
  irc.socket.on('registered', function(data) {
    irc.socket.emit('getNick', {});
    irc.connected = true;
    irc.appView.render();
    irc.chatWindows.add({name: 'status', type: 'status'});

    // Will reflect modified nick, if chosen nick was taken already
    irc.me.set('nick', data.message.args[0]);
  });

  irc.socket.on('login_success', function(data) {
    if(data.exists){
      irc.socket.emit('connect', {});
    } else {
      $('#overview').html(ich.overview_connection());
    }
  });

  irc.socket.on('register_success', function(data) {
    $('#overview').html(ich.overview_connection());
  });

  irc.socket.on('restore_connection', function(data) {
    irc.me = new User({nick: data.nick, server: data.server});
    irc.connected = true;
    irc.appView.render();
    irc.chatWindows.add({name: 'status', type: 'status'});
    $.each(data.channels, function(key, value){
      if(value['serverName'][0] == '#'){
        irc.chatWindows.add({name: value['serverName']});
      } else {
        irc.chatWindows.add({name: value['serverName'], type: 'pm'});
      }
      var channel = irc.chatWindows.getByName(value['serverName']);
      var channelTabs = irc.appView.channelList.channelTabs;
      var channelTab = channelTabs[channelTabs.length-1];
      channel.set({
        topic: value['topic'],
        unread: value['unread_messages'],
        unreadMentions: value['unread_mentions']
      });
      channelTab.updateUnreadCounts();
      if(value['serverName'][0] == '#'){
        channel.userList = new UserList(channel);
        $.each(value.users, function(user, role) {
          channel.userList.add({nick: user, role: role, idle:0, user_status: 'idle', activity: ''});
        });
        irc.socket.emit('getOldMessages',{channelName: value['serverName'], skip:-50, amount: 50});
      } else {
        var myNick = irc.me.get('nick');
        var logname = (myNick < value['serverName']) ? myNick + value['serverName'] : value['serverName'] + myNick;
        irc.socket.emit('getOldMessages',{channelName: logname, skip:-50, amount: 50});
        channel.stream.add(new Message({sender:'', raw:''}));
      }
    });

    $('.channel:first').click();
  });

  irc.socket.on('notice', function(data) {
    //TODO: make this work
    //irc.chatWindows.getByName('status').stream.add({sender: 'notice', raw: data.text, type: 'notice'});
  });

  // Message of the Day
  irc.socket.on('motd', function(data) {
    var message = new Message({sender: 'status', raw: data.motd, type: 'motd'});
    irc.chatWindows.getByName('status').stream.add(message);
  });

  irc.socket.on('message', function(data) {
    var chatWindow = irc.chatWindows.getByName(data.to);
    var type = 'message';
    // Only handle channel messages here; PMs handled separately
    if (data.to.substr(0, 1) === '#') {
      chatWindow.stream.add({sender: data.from, raw: data.text, type: type});
    } else if(data.to !== irc.me.get('nick')) {
      // Handle PMs intiated by me
      chatWindow.stream.add({sender: data.from, raw: data.text, type: 'pm'});
    }
  });

  irc.socket.on('pm', function(data) {
    var chatWindow = irc.chatWindows.getByName(data.nick);
    if (typeof chatWindow === 'undefined') {
      var myNick = irc.me.get('nick');
      var logname = (myNick < data.nick) ? myNick + data.nick : data.nick + myNick;
      irc.chatWindows.add({name: data.nick, type: 'pm'})
        .trigger('forMe', 'newPm');
      irc.socket.emit('getOldMessages',{channelName: logname, skip:-50, amount: 50});
      chatWindow = irc.chatWindows.getByName(data.nick);
    }
    chatWindow.stream.add({sender: data.nick, raw: data.text, type: 'pm'});
  });

  irc.socket.on('join', function(data) {
    console.log('Join event received for ' + data.channel + ' - ' + data.nick);
    if (data.nick === irc.me.get('nick')) {
      irc.chatWindows.add({name: data.channel});
      irc.socket.emit('getOldMessages',{channelName: data.channel, skip:-50, amount: 50});
    } else {
      var channel = irc.chatWindows.getByName(data.channel);
      if (typeof channel === 'undefined') {
        irc.chatWindows.add({name: data.channel});
        channel = irc.chatWindows.getByName(data.channel);
      }
      channel.userList.add({nick: data.nick, role: data.role, idle:0, user_status: 'idle', activity: ''});
      var joinMessage = new Message({type: 'join', nick: data.nick});
      channel.stream.add(joinMessage);
    }
  });

  irc.socket.on('part', function(data) {
    console.log('Part event received for ' + data.channel + ' - ' + data.nick);
    var channel = irc.chatWindows.getByName(data.channel);
    if (data.nick === irc.me.get('nick')) {
      channel.part();
    } else {
      var user = channel.userList.getByNick(data.nick);
      user.view.remove();
      user.destroy();
      var partMessage = new Message({type: 'part', nick: data.nick});
      channel.stream.add(partMessage);
    }
  });

  irc.socket.on('quit', function(data) {
    var channel, user, quitMessage;
    for(var i=0; i<data.channels.length; i++){
      channel = irc.chatWindows.getByName(data.channels[i]);
      if(channel !== undefined) {
        user = channel.userList.getByNick(data.nick);
        user.view.remove();
        user.destroy();
        quitMessage = new Message({type: 'quit', nick: data.nick, reason: data.reason, message: data.message});
        channel.stream.add(quitMessage);
      }
    }
  });

  irc.socket.on('names', function(data) {
    var channel = irc.chatWindows.getByName(data.channel);
    channel.userList = new UserList(channel);
    $.each(data.nicks, function(nick, role){
      channel.userList.add(new User({nick: nick, role: role, idle:61, user_status: 'idle', activity: ''}))
    });
  });

  irc.socket.on('nick', function(data) {
    if (data.oldNick === irc.me.get('nick'))
      irc.me.set('nick', data.newNick);

    // TODO: If not me, change name in user list and send channel message
  });

  irc.socket.on('topic', function(data) {
    var channel = irc.chatWindows.getByName(data.channel);
    channel.set({topic: data.topic});
    var topicMessage = new Message({type: 'topic', nick: data.nick, topic: data.topic});
    channel.stream.add(topicMessage);
  });

  irc.socket.on('error', function(data) {
    console.log(data.messsage);
  });

  irc.socket.on('netError', function(data) {
    console.log(data);
    irc.appView.showError('Invalid server');
  });

  irc.socket.on('login_error', function(data) {
    irc.appView.showError(data['message']);
  });

  irc.socket.on('oldMessages', function(data){
    var output = '';
    channel = irc.chatWindows.getByName(data.name);

    $.each(data.messages, function(index, message){
      if($('#' + message._id).length) {
        return true; //continue to next iteration
      }

      var type = '';
      var message_html;
      if (message.message.substr(1, 6) === 'ACTION') {
        message_html = ich.action({
          user: message.user,
          content: message.message.substr(8),
          renderedTime: utils.formatDate(message.date)
        }, true);
      } else {
        message_html = ich.message({
          user: message.user,
          content: message.message,
          renderedTime: utils.formatDate(message.date)
        }, true);
      }


      if(message.user == irc.me.get('nick')){
        type = 'message-me';
      } else {
        message_html = utils.mentions(message_html);
      }

      message_html = utils.linkify(message_html);
      message_html = "<div id=\"" + message._id + "\" class=\"message-box " + type + "\">" + message_html + "</div>";
      output += message_html;
    });
    var old_height = channel.view.$('#chat-contents')[0].scrollHeight;
    channel.view.$('#chat-contents').prepend(output);
    var new_height = channel.view.$('#chat-contents')[0].scrollHeight+1000-old_height;

    if(new_height > 1200){
      $('#chat-contents').scrollTop(new_height);
    }
  })

  irc.handleCommand = function(commandText) {
    switch (commandText[0]) {
      case '/join':
        irc.socket.emit('join', commandText[1]);
        break;
      case '/wc':
      case '/close':
      case '/part':
        if (commandText[1]) {
          irc.socket.emit('part', commandText[1]);
          irc.appView.channelList.channelTabs[0].setActive();
        } else {
          irc.socket.emit('part', irc.chatWindows.getActive().get('name'));
          irc.appView.channelList.channelTabs[0].setActive();
        }
        break;
      case '/topic':
        if (commandText[2]) {
          irc.socket.emit('topic', {name: commandText[1], topic: commandText[2]});
        } else {
          irc.socket.emit('topic', {name: irc.chatWindows.getActive().get('name'),
            topic: commandText[1]});
        }
        break;
      case '/me':
        irc.socket.emit('action', {
          target: irc.chatWindows.getActive().get('name'),
          message: commandText.splice(1).join(" ")
        });
        break;
      case '/query':
      case '/privmsg':
      case '/msg':
        var target = commandText[1];
        var myNick = irc.me.get('nick');
        var logname = (myNick < target) ? myNick + target : target + myNick;
        if (typeof irc.chatWindows.getByName(target) === 'undefined') {
          irc.chatWindows.add({name: target, type: 'pm'});
        }
        irc.socket.emit('getOldMessages',{channelName: logname, skip:-50, amount: 50});
        irc.socket.emit('say', {
          target: target,
          message: commandText.splice(2).join(" ")
        });
        break;
      default:
        commandText[0] = commandText[0].substr(1).toUpperCase();
        irc.socket.emit('command', commandText);
    }
  };

});

