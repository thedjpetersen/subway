var ChatView = Backbone.View.extend({
  initialize: function() {
    //We have to do this here or
    //messages won't stay in the element
    //when we switch tabs
    this.el = ich.chat();
    this.render();
    this.model.bind('change:topic, this.updateTitle, this');
  },

  updateTitle: function(channel) {
    console.log('title updated');
    console.log(channel);
    var context = {
      title: this.model.get('name'),
      status: this.model.get('topic')
    };
    this.$('#chat-bar').html(ich.titlebar(context));
  },

  render: function() {
    $('.content').html(this.el);
    this.updateTitle();
    this.removeUnread();
    this.handleInput();
    return this;
  },

  removeUnread: function() {
    if (this.model.channelTab !== undefined){
      this.model.channelTab.children('.unread').remove();
    }
  },

  handleInput: function() {
    $('#chat_input').bind({
      // Enable button if there's any input
      change: function() {
        if ($(this).val().length) {
          $('#chat_button').removeClass('disabled');
        } else {
          $('#chat_button').addClass('disabled');
        }
      },

      // Prevent tab moving focus for tab completion
      keydown: function(event) {
        if (event.keyCode == 9) {
          event.preventDefault();
        }
      },

      keyup: function(event) {
        if ($(this).val().length) {
          if (event.keyCode == 13) {
            var message = $(this).val();
            // Handle IRC commands
            if (message.substr(0,1) === '/') {
              var command_text = message.substr(1).split(' ');
              irc.handleCommand(command_text);
            } else {
              // Send the message
              irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            $(this).val('');
            $('#chat_button').addClass('disabled');
          } else if (event.keyCode == 9) {
            console.log(event);
            // Tab completion of user names
            var sentence = $(this).val().split(' ');
            var partialMatch = sentence.pop();
            // TODO: Make this work (copy-paste from old code; it doesn't work)
            // All the below code is busted until this is resolved.
            // channel = app.model.chatApp.channels.findChannel(app.activeChannel);
            var users = channel.attributes.users;
            for (user in users) {
              if (partialMatch.length > 0 && user.search(partialMatch) === 0) {
                sentence.push(user);
                if (sentence.length === 1) {
                  $(this).val(sentence.join(' ') +  ":");
                } else {
                  $(this).val(sentence.join(' '));
                }
              }
            }
          } else {
            $('#chat_button').removeClass('disabled');
          }
        } else {
          $('#chat_button').addClass('disabled');
        }
      }
    });
  }
});
