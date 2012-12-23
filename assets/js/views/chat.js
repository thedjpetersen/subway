var ChatView = Backbone.View.extend({
  initialize: function() {
    // We have to do this here or messages won't stay in the element
    // when we switch tabs
    this.setElement(ich.chat());
    var name = this.model.get('name');
    /*
    if(name[0] === '#' || name === 'status'){
      this.render();
    }
    */
    this.model.bind('change:topic', this.updateTitle, this);
    this.model.stream.bind('add', this.addMessage, this);
  },

  updateTitle: function(channel) {
    var topic = this.model.get('topic') || '';
    var context = {
      title: this.model.get('name'),
      topic: utils.linkify(topic)
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
    this.handleScroll();
    this.handleClick();
    $('#chat-input').focus();
    return this;
  },

  handleInput: function() {
    $('#chat-button').click( function(){
      var message = $('#chat-input').val();
      if (message.substr(0, 1) === '/') {
        var commandText = message.substr(1).split(' ');
        irc.commands.handle(commandText);
      } else {
        irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
      }
      $('#chat-input').val('');
    });

    // Only submit message on enter if both keydown & keyup are present
    // so IMEs work
    var keydownEnter = false;
    $('#chat-input').bind({
      // Enable button if there's any input
      change: function() {
        if ($(this).val().length) {
          $('#chat-button').removeClass('disabled');
        } else {
          $('#chat-button').addClass('disabled');
        }
      },

      // Prevent tab moving focus for tab completion
      keydown: function(event) {
        if (event.keyCode == 9) {
          event.preventDefault();
        }
        keydownEnter = (event.keyCode === 13);
      },

      keyup: function(event) {
        var self = this;
        if ($(this).val().length) {
          if (keydownEnter && event.keyCode === 13) {
            var message = $(this).val();
            // Handle IRC commands
            if (message.substr(0, 1) === '/') {
              var commandText = message.substr(1).split(' ');
              irc.commands.handle(commandText);
            } else {
              // Send the message
              console.log(irc.chatWindows.getActive().get('name'));
              irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            $(this).val('');
            $('#chat-button').addClass('disabled');
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
              searchRe = new RegExp(self.partialMatch, "i");
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
                  $('#chat-input').val(sentence.join(' ') +  ": ");
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
            $('#chat-button').removeClass('disabled');
          }
        } else {
          $('#chat-button').addClass('disabled');
        }
        isEnter = false;
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

    if (sender === irc.me.get('nick') && ['message', 'pm'].indexOf(type) !== -1) {
      $(view.el).addClass('message-me');
    }

    if(['join', 'part', 'topic', 'nick', 'quit'].indexOf(type) !== -1){
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

  handleScroll: function() {
    $('#chat-contents').scroll(function(){
      if ($('#chat-contents').scrollTop() < 150) {
        var skip = $('#chat-contents').children().length,
        windowName = irc.chatWindows.getActive().get('name'),
        target;

        if(windowName[0] == '#'){
          target = windowName;
        } else {
          var userName = irc.me.get('nick');
          target = (userName < windowName) ? userName + windowName : windowName + userName;
        }
        irc.socket.emit('getOldMessages',{channelName: target, skip:skip, amount: 50});
      }
    });
  },

  handleClick: function() {
    $('.hide_embed').live("click", function() {
      var embed_div = $(this).parent().siblings('.embed');
      embed_div.addClass('hide');
      $(this).siblings('.show_embed').removeClass('hide');
      $(this).addClass('hide');
    });

    $('.show_embed').live("click", function() {
      var embed_div = $(this).parent().siblings('.embed');
      embed_div.removeClass('hide');
      $(this).siblings('.hide_embed').removeClass('hide');
      $(this).addClass('hide');
    });

    // MOBILE: toggler slides user list in from the left.
    $('.content').removeClass('user-window-toggled');
    $('#user-window-toggle').click(function() {
        $('#user-window').toggle();
        $('.content, #channels, #chat-bar').toggleClass('user-window-toggled');
        $(this).toggleClass('user-window-toggled');
    });
  }
});
