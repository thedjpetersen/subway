var ChatView = Backbone.View.extend({
  initialize: function() {
    irc.chatWindows.bind('setActive', this.setActiveChannel, this);
    this.el = ich.chat();
    this.render();
  },

  render: function() {
    $('.content').html(this.el);
    return this;
  },

  setActiveChannel: function(channel) {
    this.render();
  }
});
