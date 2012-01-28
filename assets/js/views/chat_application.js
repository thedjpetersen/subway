var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    irc.chatWindows.bind('change:active', this.focus, this)
      .bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);
    // Preload sound files
    if (this._supportedFormat) {
      this.sounds = {
        newPm: this._loadSound('new-pm'),
        message: this._loadSound('msg')
      };
    }
    this.render();
  },

  render: function() {
    $('body').html($(this.el).html(ich.chat_application()));
    if (!irc.connected) {
      var overview = new OverviewView;
    } else {
      this.channelList = new ChannelListView;
    }
    return this;
  },

  focus: function(chat) {
    if (!chat.get('active')) {
      return;
    }
    console.log('focused on channel ' + chat.get('name'));
  },

  // Show number of unread mentions in title
  showUnread: function() {
    var unreads = irc.chatWindows.unreadCount();
    if (unreads > 0)
      document.title = '(' + unreads + ') ' + this.originalTitle;
    else
      document.title = this.originalTitle;
  },

  playSound: function(type) {
    this.sounds && this.sounds[type].play();
  },

  _loadSound: function(name) {
    var a = new Audio();
    a.src = '/assets/sounds/' + name + '.' + this._supportedFormat();
    console.log(a.src);
    return a;
  },

  // Detect supported HTML5 audio format
  _supportedFormat: function() {
    var a = document.createElement('audio');
    if (!a.canPlayType) return false;
    else if (!!(a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')))
      return 'ogg'
    else if (!!(a.canPlayType('audio/mpeg;').replace(/no/, '')))
      return 'mp3'
  }
});
