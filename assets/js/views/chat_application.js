var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).append(ich.chat_application()));
    var overview = new OverviewView();
    return this;
  }
});
