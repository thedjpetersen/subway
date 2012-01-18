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
    var users = [];
    for (var i=0; i<this.models.length; i++){
      users.push(this.models[i].get('nick'));
    }
    return users;
  }
});

