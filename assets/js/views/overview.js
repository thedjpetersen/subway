var OverViewView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  tagName: 'div',

  className: 'container-fluid',

  render: function(event) {
    $('.content').html($(this.el).html(ich.overview()));
    if(event === undefined) {
      $('#overview').html(ich.overview_home());   
    } else {
      var func = ich['overview_' + event.currentTarget.id];  
      $('#overview').html(func());
    }
    $('.overview_button').bind('click', jQuery.proxy(this.render, this));
    return this;
  }
});
