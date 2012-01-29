// Collection of messages that belong to a frame
var Stream = Backbone.Collection.extend({
  model: Message,

  unread: function() {
    return this.filter(function(msg) { return msg.get('unread'); });
  },

  unreadMentions: function() {
    return this.filter(function(msg) { return msg.get('unreadMention'); });
  }
});

// All channels/private message chats a user has open
var WindowList = Backbone.Collection.extend({
  model: ChatWindow,

  initialize: function() {
    this.bind('add', this.setActive, this);
    this.bind('add', function(chat) {
      if (chat.get('type') === 'pm') this.trigger('forMe', 'newPm');
    })
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

  // Restrict to a certain type of chat window
  byType: function(type) {
    return this.filter(function(chat) {
      return chat.get('type') === type;
    });
  },

  // Unread private messages and mentions
  unreadCount: function() {
    var channels = this.byType('channel');
    var pms = this.byType('pm');

    var count = 0;
    count = channels.reduce(function(prev, chat) {
      return prev + chat.get('unreadMentions');
    }, 0);
    count += pms.reduce(function(prev, chat) {
      return prev + chat.get('unread');
    }, 0);

    return count;
  }

});

var UserList = Backbone.Collection.extend({
  model: User,

  initialize: function(channel) {
    this.channel = channel;
    this.view = new UserListView({collection:this});
  },

  getByNick: function(nick) {
    return this.detect(function(user) {
      return user.get('nick') == nick;
    });
  },

  getUsers: function() {
    var users = this.map(function(user) {
      return user.get('nick');
    });
    return users;
  }
});

