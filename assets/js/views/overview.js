var OverviewView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  events: {
    'click #connect-button': 'connect',
    'click #login-button': 'login_register',
    'click #register-button': 'login_register',
    'keypress': 'connectOnEnter',
    'click #connect-secure': 'toggle_ssl_options'
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
      event.action= 'Login';
      this.login_register(event);
    }
    if($('#register-button').length){
      event.action = 'Register';
      this.login_register(event);
    }
  },

  connect: function(event) {
    event.preventDefault();
    $('.error').removeClass('error');

    var server = $('#connect-server').val();
    var nick = $('#connect-nick').val();
    var port = $('#connect-port').val();
    var away = $('#connect-away').val();
    var realName = $('#connect-realName').val();
    var secure = $('#connect-secure').is(':checked');
    var selfSigned = $('#connect-selfSigned').is(':checked');
    var rejoin = $('#connect-rejoin').is(':checked');
    var password = $('#connect-password').val();
    
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
        server: server,
	      port: port,
        secure: secure,
        selfSigned: selfSigned,
        rejoin: rejoin,
        away: away,
        realName: realName,
        password: password
      };

      irc.me = new User(connectInfo);
      irc.me.on('change:nick', irc.appView.renderUserBox);
      irc.socket.emit('connect', connectInfo);
    }
  },

  login_register: function(event) {
    var action = event.target.innerHTML.toLowerCase() || event.action.toLowerCase();
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
  },

  toggle_ssl_options: function(event) {
    var port = $('#connect-secure').is(':checked') ? 6697 : 6667 
    $('#connect-port').attr('placeholder', port)
    $('#ssl-self-signed').toggle();
  }


});
