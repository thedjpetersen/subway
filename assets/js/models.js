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
    if ((this.get('type') === 'message' || this.get('type') == 'mode') && this.get('raw').search('\\b' + irc.me.get('nick') + '\\b') !== -1){
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
    if (signal) {
      this.trigger('forMe', 'message');

      // Chrome Desktop Notfication support.
      // Written by Maikel Wever (GitHub @maikelwever)
      // Only send notification if Chrome supports it,
      // and the page is hidden (to prevent annoyingness)
      if (window.webkitNotifications && 
            (document.webkitHidden == true || document.webkitHidden == undefined)
          ) {
        // Permissions should be granted in the settings window @ home
        // This should be done only once per domain
        if (window.webkitNotifications.checkPermission() == 0) {

          // This builds the message title, according to the type of message.
          var messageTitle = "Mention in ";
          if (msg.attributes.type == "pm") {
            messageTitle = "PM from ";
          } 
          messageTitle += msg.collection.channel.attributes.name;

          // Create a webkit notification, with the subway logo,
          // the above generated message title and
          // the actual message send to the user
          var notification = window.webkitNotifications.createNotification(
            '/assets/images/subway.png',
            messageTitle,
            msg.attributes.sender + " says " + msg.attributes.text
          );
          // Notifications API requires an explicit show to show a notification
          notification.show();

          // Programatically close the notification after 5 seconds.
          setTimeout(function() {
            notification.close();
          }, 5000);
        }
      }
      // END Chrome Desktop Notification support
    }
  }

});

var User = Backbone.Model.extend({
  initialize: function() {
  },

  defaults: {
    opStatus: ''
  }
});
