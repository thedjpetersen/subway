var ChannelListView = Backbone.View.extend({
  el: '#channels',

  initialize: function() {
    console.log('channel list init');
    irc.chatWindows.bind('add', this.addChannel, this);
  },

  addChannel: function(chat) {
    console.log('channel added to list');
    $(this.el).append(ich.channel({name: chat.get('name')}));
  }

});