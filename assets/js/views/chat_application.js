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
      var chat = new ChatView;
      var channelList = new ChannelListView;
    }
    return this;
  },

  addMessage: function(msg) {
    var view = new MessageView({model: msg});
    $('#chat-contents').append(view.el);
    console.log('message added!');
    $('#chat-contents').scrollTop( $('#chat-contents').scrollTop() + 100 );
  },

  focus: function(chat) {
    if (!chat.get('active')) {
      console.log(chat.get('name') + ' not set as active');
      return;
    }
    console.log('focused on channel ' + chat.get('name'));
    chat.stream.bind('add', this.addMessage, this);
  }
});
