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
  },

  parse: function(text) {
    var nick = this.get('sender') || this.collection.channel.get('name');
    var result = this._linkify(text);
    if (nick !== irc.me.nick) {
      result = this._mentions(result);
    }
    return result;
  },

  // Find and link URLs
  // TODO: put youtube and image embedding code
  // into own function
  _linkify: function(text) {
    // see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    var links = [];
    var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
    var parsed = text.replace(re, function(url) {
      // turn into a link
      var href = url;
      if (url.indexOf('http') !== 0) {
        href = 'http://' + url;
      }
      links.push(href);
      return '<a href="' + href + '" target="_blank">' + url + '</a>';
    });
    console.log(links);
    if (links.length>0){
      //Look for embeddable media in all the links
      for (var i=0; i<links.length; i++){
        var href = links[i];
        //Add embedded youtube video
        if (href.search('http://www.youtube.com') > -1) {
          var video_id = href.split('v=')[1];
          var targetPosition = video_id.indexOf('&');
          if(targetPosition !== -1) {
            video_id = video_id.substring(0, targetPosition);
          }
          parsed = parsed.split('</div><div class=\"chat-time\">').join(ich.youtube_embed({video_id:video_id}, true) + '</div><div class=\"chat-time\">');
        }

        //Add embedded images
        if (jQuery.inArray(href.substr(-3), ['jpg', 'gif', 'png']) > -1){
          parsed = parsed.split('</div><div class=\"chat-time\">').join(ich.image_embed({link:href}, true) + '</div><div class=\"chat-time\">');
        }
      }
    }
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
    this.set({unread: this.get('unread') + 1});
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
  initialize: function(){
  },

  defaults: {
    opStatus: ''
  }
});
