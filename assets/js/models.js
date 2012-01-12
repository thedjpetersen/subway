var Message = Backbone.Model.extend({
  defaults: {
    // expected properties:
    // - sender
    // - raw
    'type': 'message'
  },

  initialize: function() {
    if (this.get('raw')) {
      this.set({text: this.parse(this.get('raw'))});
    }
  },

  parse: function(text) {
    var nick = this.get('sender') || this.collection.channel.get('name');
    var result = this._linkify(ich.message({user: nick, content: this.get('raw'), rendered_time: this._formatDate(Date.now())}, true));
    if (nick !== irc.me.nick) {
      result = this._mentions(result);
    }
    return result;
  },

  // Set output text for status messages
  setText: function() {
    var text = '';
    switch (this.get('type')) {
      case 'join':
      text = this.get('nick') + ' joined the channel';
      break;
      case 'part':
      text = this.get('nick') + ' left the channel';
      break;
      case 'nick':
      text = this.get('oldNick') + ' is now known as ' + this.get('newNick');
      break;
    }
    this.set({text: text});
  },

  _formatDate: function (date) {
    var d = new Date(date);
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12) {
      h = hh-12;
      dd = "PM";
    }
    if (h == 0) {
      h = 12;
    }
    m = m<10?"0"+m:m;

    s = s<10?"0"+s:s;

    /* if you want 2 digit hours:
    h = h<10?"0"+h:h; */

    var replacement = h+":"+m;
    /* if you want to add seconds
    repalcement += ":"+s;  */
    replacement += " "+dd;

    return d.toDateString() + ', ' + replacement;
  },

  // Find and link URLs
  _linkify: function(text) {
    // see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
    var parsed = text.replace(re, function(url) {
      // turn into a link
      var href = url;
      if (url.indexOf('http') !== 0) {
        href = 'http://' + url;
      }
      return '<a href="' + href + '" target="_blank">' + url + '</a>';
    });
    return parsed;
  },

  _mentions: function(text) {
    var self = this;
    var re = new RegExp('\\b' + irc.me.nick + '\\b', 'g');
    var parsed = text.replace(re, function(nick) {
      self.set({mention: true});
      return '<span class="mention">' + nick + '</span>';
    });
    return parsed;
  }

});


// Represents any type of chat window -- a channel, private message,
// or the status/console window.
var ChatWindow = Backbone.Model.extend({
  // expected properties:
  // - name
  defaults: {
    type: 'channel',
    active: true
  },

  initialize: function() {
    console.log('chat window created');
    this.stream = new Stream();
    this.stream.bind('add', this.unreadMessages);
    //Backbone's collections don't support
    //attribute assignment in initizialization
    this.view = new ChatView({model: this});
  },

  part: function() {
    console.log('Leaving ' + this.get('name'));
    this.destroy();
  },

  unreadMessages: function(msg) {
    if (!this.channel.get('active')) {
      //Remove the old spans
      this.channel.channelTab.children('.unread').remove();
      this.channel.channelTab.children('.unread_mentions').remove();

      //Increment our unread messages
      var unread_messages = this.channel.get('unread_messages') + 1;
      this.channel.set({unread_messages: unread_messages});

      //If the message has a mention
      if (msg.get('unread_mention')) {
        //Set our unread mentions
        var unread_mentions = this.channel.get('unread_mentions') + 1;
        this.channel.set({unread_mentions: unread_mentions});

        //Add our modified spans
        this.channel.channelTab.append(ich.unread({unread:unread_messages}));
        this.channel.channelTab.append(ich.unread_mentions({unread_mentions: unread_mentions}));
      } else {
        var unread_mentions = this.channel.get('unread_mentions');
        this.channel.channelTab.append(ich.unread({unread:unread_messages}));
        if (unread_mentions > 0) {
          this.channel.channelTab.append(ich.unread_mentions({unread_mentions: unread_mentions}));
        }
      }
    }
  }

});

var User = Backbone.Model.extend({
  defaults: {
    opStatus: ''
  }
});

