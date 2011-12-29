var ChatView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  render: function() {
    // $('.content').html(this.el);
    $('.content').html(ich.chat());
    var activeChannel = window.irc.chatWindows.getActive();
    return this;
  }
});
