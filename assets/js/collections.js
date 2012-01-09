// Collection of messages that belong to a frame
var Stream = Backbone.Collection.extend({
  model: Message,

  initialize: function() {
    this.bind('add', irc.appView.addMessage);
    this.bind('add', this.unread_messages);
  },

  unread_messages: function(msg) {
    if(!this.channel.get('active')){
      this.channel.channelTab.children('.unread').remove();
      this.channel.channelTab.children('.unread_mentions').remove();
      var unread_messages = this.channel.get('unread_messages')+1;
      this.channel.set({unread_messages: unread_messages});
      this.channel.channelTab.append(ich.unread({unread:unread_messages}));
      if(msg.get('unread_mention')){
        var unread_mentions = this.channel.get('unread_mentions')+1;
        this.channel.set({unread_mentions: unread_mentions});
        this.channel.channelTab.append(ich.unread_mentions({unread_mentions: unread_mentions}));
      }
    }
  }
});

// All channels/private message chats a user has open
var WindowList = Backbone.Collection.extend({
  model: ChatWindow,

  initialize: function() {
    var self = this;
    this.bind('add', function(chat) {
      self.setActive(chat);
    });

  },

  getByName: function(name) {
    return this.detect(function(chat) {
      return chat.get('name') === name;
    });
  },

  getActive: function() {
    return this.detect(function(chat) {
      return chat.get('active') === true;
    });
  },

  setActive: function(selected) {
    console.log(selected.get('name') + ' set as active chat!');
    this.each(function(chat) {
      chat.set({active: false});
    });

    selected.set({active: true, unread_messages: 0, unread_mentions: 0});
    selected.view.render();
  },

  getChannels: function() {
    return this.filter(function(chat) {
      return chat.get('type') === 'channel';
    });
  }

});

var UserList = Backbone.Collection.extend({
  model: User,
  getByNick: function(nick) {
    return this.detect(function(user) {
      return user.get('nick') == nick;
    });
  }
});

