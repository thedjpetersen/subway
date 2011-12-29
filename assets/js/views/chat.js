var ChatView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  render: function() {
    // $('.content').html(this.el);
    var activeChannel = window.irc.ChatWindows.getActive();
    return this;
  }
});
