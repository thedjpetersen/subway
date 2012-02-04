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

  connect: function(e) {
    e.preventDefault();
    $('.error').removeClass('error');
    var server = $('#connect-server').val();
    var nick = $('#connect-nick').val();
    if (!server) {
      $('#connect-server').closest('.clearfix').addClass('error');
      $('#connect-server').addClass('error');
    }
    if (!nick) {
      $('#connect-nick').closest('.clearfix').addClass('error');
      $('#connect-nick').addClass('error');
    }
    if (nick && server) {
      $('form').append(ich.load_image());
      $('#connect-button').addClass('disabled');

      var connectInfo = {
        nick: nick,
        server: server
      };
      irc.me = connectInfo;
      irc.socket.emit('connect', connectInfo);
    }
  }
});
