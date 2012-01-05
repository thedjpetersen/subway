var ChatView = Backbone.View.extend({
  initialize: function() {
    this.el = ich.chat();
    this.render();
  },

  render: function() {
    $('.content').html(this.el);
    return this;
  }
});
