var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).html(ich.chat_application()));
    if (!irc.connected) {
      var overview = new OverviewView();
    } else {
      var chatview = new ChatView();
    }
    return this;
  }
});
