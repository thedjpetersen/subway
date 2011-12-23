var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  tagName: 'div',

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).append(ich.chat_window()));
    return this;
  }
});
