var ChatView = Backbone.View.extend({
  initialize: function() {
    // We have to do this here or messages won't stay in the element
    // when we switch tabs
    this.setElement(ich.chat());
    this.render();
    this.model.bind('change:topic', this.updateTitle, this);
    this.model.stream.bind('add', this.addMessage, this);
  },

  updateTitle: function(channel) {
    var topic = this.model.get('topic') || '';
    var context = {
      title: this.model.get('name'),
      topic: topic
    };
    this.$('#chat-bar').html(ich.titlebar(context));
  },

  render: function() {
    $('.content').html(this.el);
    $('#chat-contents').scrollTop(
      $('#chat-contents')[0].scrollHeight - $('#chat-contents').height()
    );
    this.updateTitle();
    this.handleInput();
    $('#chat-input').focus();
    return this;
  },

  handleInput: function() {
    $('#chat-input').bind({
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
        var self = this;
        if ($(this).val().length) {
          if (event.keyCode == 13) {
            var message = $(this).val();
            // Handle IRC commands
            if (message.substr(0, 1) === '/') {
              var commandText = message.split(' ');
              irc.handleCommand(commandText);
            } else {
              // Send the message
              irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            $(this).val('');
            $('#chat_button').addClass('disabled');
          } else if (event.keyCode == 9) {
            var searchRe;
            var match = false;
            var channel = irc.chatWindows.getActive();
            var sentence = $('#chat-input').val().split(' ');
            var partialMatch = sentence.pop();
            var users = channel.userList.getUsers();
            var userIndex=0;
            searchRe = new RegExp(self.partialMatch, "i");
            if(self.partialMatch === undefined) {
              self.partialMatch = partialMatch;
            } else if(partialMatch.search(searchRe) !== 0){
              self.partialMatch = partialMatch;
              searchRe = new RegExp(self.partialMatch, "i");
            } else {
              if (sentence.length === 0) {
                userIndex = users.indexOf(partialMatch.substr(0, partialMatch.length-1));
              } else {
                userIndex = users.indexOf(partialMatch);
              }
            }
            //Cycle through userlist from last user or beginning
            for (var i=userIndex; i<users.length; i++) {
              var user = users[i] || '';
              //Search for match
              if (self.partialMatch.length > 0 && user.search(searchRe) === 0) {
                //If no match found we continue searching
                if(user === partialMatch || user === partialMatch.substr(0, partialMatch.length-1)){
                  continue;
                }
                //If we find a match we return our match to our input
                sentence.push(user);
                match = true;
                //We decide whether or not to add colon
                if (sentence.length === 1) {
                  $('#chat-input').val(sentence.join(' ') +  ":");
                } else {
                  $('#chat-input').val(sentence.join(' '));
                }
                //We break from our loop
                break;
              } else if(i === users.length-1 && match === false) {
                sentence.push('');
                $('#chat-input').val(sentence.join(' '));
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
  },

  addMessage: function(msg) {
    var $chatWindow = this.$('#chat-contents');
    var view = new MessageView({model: msg});
    var sender = msg.get('sender');
    var type = msg.get('type');

    var nicksToIgnore = ['', 'notice', 'status'];

    if (nicksToIgnore.indexOf(sender) === -1 && type === 'message'){
      var user = this.model.userList.getByNick(sender);
      var element = $(user.view.el);
      user.set({idle: 0});
      user.view.addToIdle();
      element.prependTo(element.parent());
    }

    $chatWindow.append(view.el);

    if (sender === irc.me.nick && 'message'.indexOf(type) === 0) {
      $(view.el).addClass('message-me');
    }

    if(['join', 'part', 'topic', 'quit'].indexOf(type) !== -1){
      $(view.el).addClass('message_notification');
    }

    // Scroll down to show new message
    var chatWindowHeight = ($chatWindow[0].scrollHeight - $chatWindow.height());
    // If the window is large enough to be scrollable
    if (chatWindowHeight > 0) {
      // If the user isn't scrolling go to the bottom message
      if ((chatWindowHeight - $chatWindow.scrollTop()) < 200) {
        $('#chat-contents').scrollTo(view.el, 200);
      }
    }
  },

});
