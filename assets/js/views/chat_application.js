var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
    irc.chatWindows.bind('change:active', this.focus, this);
  },

  className: 'container-fluid',

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
  }
});
