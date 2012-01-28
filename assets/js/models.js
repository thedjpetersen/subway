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
    // TODO: add explicit HTML escape before sending to ich.message.
    // Want to add <br> to motd.
    var output;

    //This handles whether to output a message or an action
    if(text.substr(1,6) === 'ACTION') {
      output = ich.action({user: nick, content: this.get('raw').substr(8), rendered_time: this._formatDate(Date.now())}, true);
    } else {
      output = ich.message({user: nick, content: this.get('raw'), rendered_time: this._formatDate(Date.now())}, true);
      //This renders the motd the way it looks
      if(this.get('type') === 'motd'){
        output = output.replace('<span>', '<span><pre>');
        output = output.replace('</span>', '</pre></span>');
      }
    }

    var result = this._linkify(output);
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
        text = '<span class="join_img"></span><b>' + this.get('nick') + '</b> joined the channel';
        break;
      case 'part':
        text = '<span class="part_img"></span><b>' + this.get('nick') + '</b> left the channel';
        break;
      case 'nick':
        text = '<b>' + this.get('oldNick') + '</b> is now known as ' + this.get('newNick');
        break;
      case 'topic':
        text = '<span class="topic_img"></span><b>' + this.get('nick') + '</b> has changed the topic to <i>' + this.get('topic') + '</i>';
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
          parsed = parsed.split('</div><div class=\"chat_time\">').join(ich.youtube_embed({video_id:video_id}, true) + '</div><div class=\"chat_time\">');
        }

        //Add embedded images
        if (jQuery.inArray(href.substr(-3), ['jpg', 'gif', 'png']) > -1){
          parsed = parsed.split('</div><div class=\"chat_time\">').join(ich.image_embed({link:href}, true) + '</div><div class=\"chat_time\">');
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
    // Increment our unread messages
    this.set({unread: this.get('unread') + 1});
    if (msg.get('mention'))
      this.set({unreadMentions: this.get('unreadMentions') + 1});
  }

});

var User = Backbone.Model.extend({
  initialize: function(){
  },

  defaults: {
    opStatus: ''
  }
});
