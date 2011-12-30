var ChatView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  render: function() {
    $('.content').html(ich.chat());
    var activeChannel = irc.chatWindows.getActive();
    return this;
  }
});
