var ChatView = Backbone.View.extend({
  initialize: function() {
    irc.chatWindows.bind('setActive', this.setActiveChannel, this);
  },

  render: function() {
    var activeChannel = irc.chatWindows.getActive();
    $('.content').html(activeChannel.view.render());
    return this;
  },

  setActiveChannel: function(channel) {
    this.render();
  }
});
