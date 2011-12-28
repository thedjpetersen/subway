var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).append(ich.chat_application()));
    if (!window.connected) {
      var overview = new OverviewView();
      this.$('content').html(overview.render());
    } else {
    }
    return this;
  }
});
