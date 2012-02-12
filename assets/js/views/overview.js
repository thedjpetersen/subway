var OverviewView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  events: {
    'click #connect-button': 'connect',
    'click #login-button': 'login_register',
    'click #register-button': 'login_register',
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
    if($('#connect-button').length){
      this.connect(event);
    }
    if($('#login-button').length){
      this.login_register(event);
    }
    if($('#register-button').length){
      this.login_register(event);
    }
  },

  connect: function(event) {
    event.preventDefault();
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
      irc.me = new User(connectInfo);
      irc.me.on('change:nick', irc.appView.renderUserBox);
      irc.socket.emit('connect', connectInfo);
    }
  },

  login_register: function(event) {
    var action = event.target.innerText.toLowerCase();
    event.preventDefault();
    $('.error').removeClass('error');
    var username = $('#' + action + '-username').val();
    var password = $('#' + action + '-password').val();
    if (!username) {
      $('#' + action + '-username').closest('.clearfix').addClass('error');
      $('#' + action + '-username').addClass('error');
    }
    if (!password) {
      $('#' + action + '-password').closest('.clearfix').addClass('error');
      $('#login-password').addClass('error');
    }
    if(username && password){
      $('form').append(ich.load_image());
      $('#' + action + '-button').addClass('disabled');
    }

    irc.socket.emit(action, {
      username: username,
      password: password
    });
  }

});
