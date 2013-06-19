var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    irc.chatWindows.bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);
    
    // Chrome Desktop Notification support
    if (window.webkitNotifications) {
      irc.chatWindows.bind('messageNotification', this.chromeNotification, this);
    }


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
        // Only assign if there's currently an active window
        // Guards against losing activeChat if there's a second blur event
        activeChat = irc.chatWindows.getActive() ?
                     irc.chatWindows.getActive() :
                     activeChat;
        if (activeChat && activeChat.set) { activeChat.set('active', false); }
      }, 1000);
    }).focus(function() {
      clearTimeout(blurTimer);
      if(activeChat && activeChat.set) { activeChat.set('active', true); }
    });

    this.render();
  },

  overview: null,

  render: function() {
    $('body').html($(this.el).html(ich.chat_application()));
    if (!irc.connected) {
      this.overview = new OverviewView();
    } else {
      this.channelList = new ChannelListView;
      $('.slide').css('display', 'inline-block');
    }
    return this;
  },

  // Net connection error
  showError: function(text) {
    $('#loading_image').remove();
    $('.btn').removeClass('disabled');
    $('#home_parent').after(ich.alert({
      type: 'alert-error',
      content: text
    }).alert());
  },

  renderUserBox: function() {
    $('#user-box').html(ich.user_box(irc.me.toJSON()));

    // disconnect server handler
    $('#user-box .close-button').click(function() {
      irc.socket.emit('logout');
    });
  },

  // Show number of unread mentions in title
  showUnread: function() {
    var unreads = irc.chatWindows.unreadCount();
    if (unreads > 0) {
      document.title = '(' + unreads + ') ' + this.originalTitle;
      if( window.unity.connected ) {
        window.unity.api.Launcher.setCount(unreads);
        window.unity.api.Launcher.setUrgent(true);
      }
    }
    else {
      document.title = this.originalTitle;
      if( window.unity.connected ) {
        window.unity.api.Launcher.clearCount();
        window.unity.api.Launcher.setUrgent(false);
      }
    }
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
  },

  // Chrome Desktop Notfication support.
  // TODO: Setting to adjust time the notification shows.
  chromeNotification: function(msg) {

    // Only send notification if Chrome supports it,
    // and the page is hidden (to prevent annoyingness)
    // Permissions should be granted in the settings window @ home
    // This should be done only once per domain
    if ((document.webkitHidden === true || document.webkitHidden === undefined) 
        && window.webkitNotifications.checkPermission() == 0) {

      // This builds the message title, according to the type of message.
      var messageTitle = _.isEqual(msg.get('type'), "pm") ? "PM from " : "Mention in ";
      messageTitle += msg.collection.channel.get('name');

      // Create a webkit notification, with the subway logo,
      // the above generated message title and
      // the actual message send to the user
      var notification = window.webkitNotifications.createNotification(
        '/assets/images/subway.png',
        messageTitle,
        msg.get('sender') + " says " + msg.get('text')
      );

      // Notifications API requires an explicit show to show a notification
      notification.show();

      // Close the notification after 5 seconds.
      setTimeout(function() {
        notification.close();
      }, 5000);
    }
  }
});
