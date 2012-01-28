var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    irc.chatWindows.bind('change:active', this.focus, this)
      .bind('change:unread', this.showUnread, this)
      .bind('change:unreadMentions', this.showUnread, this)
      .bind('forMe', this.playSound, this);
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
    if (type === 'newPm')
      console.log('Play sound for new private chat');
    else if (type === 'message')
      console.log('Play sound for new mention/pm');
    else
      console.log('unexpected type in playSound');
  }
});
