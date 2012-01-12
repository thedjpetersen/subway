var ChatApplicationView = Backbone.View.extend({
  initialize: function() {
    this.render();
    irc.chatWindows.bind('change:active', this.focus, this);
  },

  className: 'container-fluid',

  render: function() {
    $('body').html($(this.el).html(ich.chat_application()));
    if (!irc.connected) {
      var overview = new OverviewView;
    } else {
      var channelList = new ChannelListView;
    }
    return this;
  },

  addMessage: function(msg) {
    var view = new MessageView({model: msg});
    var targetDiv = this.channel.view.$('#chat-contents');
    targetDiv.append(view.el);
    if (msg.get('sender') === irc.me.nick) {
      $(view.el).addClass('message_me');
    }
    console.log('message added!');
    var chatWindowHeight = (targetDiv.get(0).scrollHeight-555);
    //If the window is large enough to be scrollable
    if(chatWindowHeight > 0){
    //targetDiv.scrollTop( targetDiv.scrollTop() + 100 );
      //If the user isn't scrolling go to the bottom message
      if ((chatWindowHeight-targetDiv.scrollTop())<200) {
        targetDiv.scrollTo(view.el, 500);
      }
    }
  },

  focus: function(chat) {
    if (!chat.get('active')) {
      return;
    }
    console.log('focused on channel ' + chat.get('name'));
  }
});
