var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    irc.chatWindows.bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);


    // Preload sound files
    if (this._supportedFormat) {
      this.sounds = {
        newPm: this._loadSound('new-pm'),
        message: this._loadSound('msg')
      };
    }

    // Detect window focus so new message alerts come in
    // when window is not focused, even on current tab
    var blurTimer, activeChat;
    $(window).blur(function() {
      blurTimer = setTimeout(function() {
        activeChat = irc.chatWindows.getActive();
        activeChat && activeChat.set('active', false);
      }, 1000);
    }).focus(function() {
      clearTimeout(blurTimer);
      activeChat && activeChat.set('active', true);
    });

    this.render();
  },

  render: function() {
    $('body').html($(this.el).html(ich.chat_application()));
    if (!irc.connected) {
      var overview = new OverviewView;
    } else {
      this.channelList = new ChannelListView;
      // irc.me.on('change:nick', this.renderUserBox, this);
      this.renderUserBox();
    }
    return this;
  },

<<<<<<< HEAD
  // Net connection error
  showError: function(text) {
    $('#loading_image').remove();
    $('#connect-button').removeClass('disabled');
    $('#home_parent').after(ich.alert({
      type: 'alert-error',
      content: text
    }).alert());
=======
  renderUserBox: function() {
    $('#user-box').html(ich.user_box(irc.me.toJSON()));
>>>>>>> 7dcd5476c7e836b33ca020cbebb0fc84eea40129
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
