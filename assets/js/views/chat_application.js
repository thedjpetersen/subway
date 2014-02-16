var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    irc.chatWindows.bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);
    
    // Notifications.
    // Firefox notifications is the first check, chrome the other.
    if (("Notification" in window && "get" in window.Notification) ||
        "webkitNotifications" in window) {
      // build title and body for the notification saying subway has notifications
      var title = 'Notifications from Subway';
      var body = 'Subway will display notifications like this for this session';

      // We display a notification saying that subway will use notifications.
      // On Chrome this is also a way of requesting permission to display notifications.
      if (("Notification" in window && "get" in window.Notification) &&
          Notification.permission !== 'denied') {
        // We have to bind the function to `this` to be able to access this.displayNotification
        Notification.requestPermission(_.bind(function (permission) {
          if(permission === 'granted') {
            if (!('permission' in Notification)) {
              Notification.permission = permission;
            }
            this.displayNotification(title, body);
          }
        }, this));
      } else {
        this.displayNotification(title, body);
      }
      
      irc.chatWindows.bind('messageNotification', this.desktopNotification,
        this);
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
    // Remove any old error messages
    $(".alert").remove();

    // Remove artifacts from submitting the form
    $('#loading_image').remove();
    $('.btn').removeClass('disabled');

    // Add the error message
    $('#home_parent').after(ich.alert({
      type: 'alert-error',
      content: text
    })
    // Flash the alert box
    .animate({ opacity: 0}, 200)
    .animate({ opacity: 1}, 200)
    .alert());
  },

  renderUserBox: function() {
    $('#user-box').html(ich.user_box(irc.me.toJSON()));

    // disconnect server handler
    $('#user-box .close-button').click(function() {
      var response = confirm("Are you sure you want to leave this network?");
      if (response) {
        irc.socket.emit('logout');
      }
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

  // Desktop notifications when the user is highlighted
  desktopNotification: function(msg) {
    // Only show notifications if the tab or window is in the background/unfocused
    if (document.webkitHidden === true || document.webkitHidden === undefined) {
      // Build the title and body for the notification
      var title = _.isEqual(msg.get('type'), "pm") ? "PM from " : "Mention in ";
      title += msg.collection.channel.get('name');
      var body = msg.get('sender') + ' says: ' + msg.get('text');

      this.displayNotification(title, body);
    }
  },

  // Display a desktop notification. 
  displayNotification: function(title, body) {
    var icon = '/assets/images/subway.png';
    // Firefox:
    if ("Notification" in window && "get" in window.Notification) {
      if (Notification.permission === 'granted') {
        // Firefox's API doesn't need a call to a method to show the notification.
        new Notification(title, {body: body, icon: icon});
      }
    }
    // Chrome:
    else if ("webkitNotifications" in window && 
        window.webkitNotifications.checkPermission() === 0) {
      var notification = window.webkitNotifications.createNotification(
        icon, title, body
      );
      // Chrome's API need a call to .show() to show the notification.
      notification.show();

      // After 5 seconds we close the notification
      // TODO - configure the time it takes before the notification is closed?
      setTimeout(function() {
        notification.close();
      }, 5000);
    }
  }
});
