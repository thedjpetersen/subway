var ChatView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  render: function() {
    $('content').html(this.el);
    return this;
  }
});
