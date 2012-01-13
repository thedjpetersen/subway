var ChannelListView = Backbone.View.extend({
  el: '#channels',

  initialize: function() {
    console.log('channel list init');
    irc.chatWindows.bind('add', this.addChannel, this);
    irc.chatWindows.bind('setActive', this.setActiveChannel, this);
  },

  addChannel: function(chat) {
    console.log('channel added to list');
    chat.channelTab = ich.channel({name:chat.get('name')});
    $(this.el).append(chat.channelTab);
    this.setActiveChannel(chat);
    // TODO: simplify / rewrite this
    // separate view for each tab would probably simplify things
    chat.channelTab.click({chat: chat, clv: this}, function(ev) {
      chat = ev.data.chat;
      irc.chatWindows.setActive(chat);
      ev.data.clv.setActiveChannel(chat);
    });
  },

  setActiveChannel: function(chat) {
    $('.active').removeClass('active');
    if (chat.channelTab !== undefined) {
      chat.channelTab.addClass('active');
    }
  }

});
