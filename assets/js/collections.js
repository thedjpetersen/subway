// Collection of messages that belong to a frame
var Stream = Backbone.Collection.extend({
    model: Message,

    initialize: function(parent_ref) {
      this.channel = parent_ref;
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

    selected.set({active: true});
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

