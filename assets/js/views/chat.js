var ChatView = Backbone.View.extend({
  initialize: function() {
    this.el = ich.chat();
    this.render();
  },

  render: function() {
    $('.content').html(this.el);
    this.handleInput();
    return this;
  },

  handleInput: function() {
    $('#chat_input').bind({
      //if not empty remove disabled class
      change: function() {
        if ($(this).val().length) {
          $('#chat_button').removeClass('disabled');
        } else {
          $('#chat_button').addClass('disabled');
        }
      },
      keydown: function(event) {
        if (event.keyCode == 9) {
          event.preventDefault();
        }
      },
      //This handles input and sending it
      keyup: function(event) {
        if ($(this).val().length) {
          if (event.keyCode == 13) {
            var message = $(this).val();
            //logic for handling command
            if (message.substr(0,1) === '/') {
              var command_text = message.substr(1).split(' ');
              irc.handleCommand(command_text);
            } else {
              //Send our message
              irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            $(this).val('');
            $('#chat_button').addClass('disabled');
          } else if (event.keyCode == 9) {
            console.log(event);
            //This is for tab completion of user names
            var sentence = $(this).val().split(' '),
                partial_match = sentence.pop(),
                channel = window.app.model.chatApp.channels.findChannel(window.app.activeChannel);
            var users = channel.attributes.users;
            for (user in users){
              if (partial_match.length>0 && user.search(partial_match) === 0) {
                sentence.push(user);
                if (sentence.length === 1) {
                  $(this).val(sentence.join(' ') +  ":");
                } else {
                  $(this).val(sentence.join(' '));
                }
              }
            }
          }
          else {
            $('#chat_button').removeClass('disabled');
          }
        } else {
          $('#chat_button').addClass('disabled');
        }
      }
    });
  }
});
