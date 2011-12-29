var OverviewView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  events: {
    'click #connect-button': 'connect',
    'keypress': 'connectOnEnter'

  },

  el: '.content',

  render: function(event) {
    $(this.el).html(ich.overview());

    // Navigation to different overview panes
    if (event === undefined) {
      $('#overview').html(ich.overview_home());
    } else {
      var func = ich['overview_' + event.currentTarget.id];
      $('#overview').html(func());
    }

    $('.overview_button').bind('click', $.proxy(this.render, this));
    return this;
  },

  connectOnEnter: function(event) {
      if (event.keyCode !== 13) return;
      this.connect();
  },

  connect: function() {
    $('.error').removeClass('error');
    if (!$('#connect-server').val()) {
      $('#connect-server').closest('.clearfix').addClass('error');
      $('#connect-server').addClass('error');
    }
    if (!$('#connect-nick').val()) {
      $('#connect-nick').closest('.clearfix').addClass('error');
      $('#connect-nick').addClass('error');
    }
    if ($('#connect-nick').val() && $('#connect-server')) {
      $('form').append(ich.load_image());
      $('#connect-button').addClass('disabled');

      var connectInfo = {
        nick: $('#connect-nick').val(),
        server: $('#connect-server').val()
      };
      app.socket.emit('connect', connectInfo);
    }
  }
});
