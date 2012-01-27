var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

  initialize: function() {
    this.render();
    irc.chatWindows.bind('change:active', this.focus, this);
    irc.chatWindows.bind('change:unreadMentions', this.showUnread, this);
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
    var unreads = irc.chatWindows.getTotalUnreadMentions();
    if (unreads > 0)
      document.title = '(' + unreads + ') ' + this.originalTitle;
    else
      document.title = this.originalTitle;
  }
});
