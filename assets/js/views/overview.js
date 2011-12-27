var OverViewView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  tagName: 'div',

  className: 'container-fluid',

  render: function() {
    $('.content').html($(this.el).html(ich.overview()));
    return this;
  }
});
