var ChatView = Backbone.View.extend({
  initialize: function() {
    irc.chatWindows.bind('setActive', this.setActiveChannel, this);
    this.render();
    $('.content').html(ich.chat());
  },

  render: function() {
    return this;
  },

  setActiveChannel: function(channel) {
    this.render();
  }
});
