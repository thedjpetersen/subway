var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  tagName: 'div',

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).append(ich.chat_application()));
    if(!window.connected) {
      var overview_view = new OverViewView({});
      this.$('content').html(overview_view.render());
    } else {
    }
    return this;
  }
});
