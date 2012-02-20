var Message = Backbone.Model.extend({
  defaults: {
    // expected properties:
    // - sender
    // - raw
    type: 'message'
  },

  initialize: function() {
    if (this.get('raw')) {
      this.set({text: this.get('raw')});
    }

    //Temporary solution to make unread mentions work again
    if (this.get('type') === 'message' && this.get('raw').search('\\b' + irc.me.get('nick') + '\\b') !== -1){
      this.set({mention: true});
    }
  },

  parse: function(text) {
    var nick = this.get('sender') || this.collection.channel.get('name');
    var result = utils.linkify(text);
    if (nick !== irc.me.get('nick')) {
      result = utils.mentions(result);
    }
    return result;
  },
});


// Represents any type of chat window -- a channel, private message,
// or the status/console window.
var ChatWindow = Backbone.Model.extend({
  // expected properties:
  // - name
  defaults: {
    type: 'channel',
    active: true,
    unread: 0,
    unreadMentions: 0
  },

  initialize: function() {
    console.log('chat window created');
    this.stream = new Stream();
    this.stream.bind('add', this.setUnread, this);
    //Backbone's collections don't support
    //attribute assignment in initizialization
    this.stream.channel = this;
    this.view = new ChatView({model: this});
  },

  part: function() {
    console.log('Leaving ' + this.get('name'));
    this.destroy();
  },

  setUnread: function(msg) {
    if (this.get('active')) return;
    var signal = false;
    // Increment unread messages
    if(msg.get('type') === 'message' || msg.get('type') === 'pm'){
      this.set({unread: this.get('unread') + 1});
    }
    if (this.get('type') === 'pm') signal = true;
    if (msg.get('mention')) {
      this.set({unreadMentions: this.get('unreadMentions') + 1});
      signal = true;
    }
    // All PMs & mentions
    if (signal) this.trigger('forMe', 'message');
  }

});

var User = Backbone.Model.extend({
  initialize: function() {
  },

  defaults: {
    opStatus: ''
  }
});
