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
  },

  setActiveChannel: function(chat) {
    $('.active').removeClass('active');
    if(chat.channelTab !== undefined) {
      chat.channelTab.addClass('active');
    }
  }
});
