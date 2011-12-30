var ChannelListView = Backbone.View.extend({
  el: $('#channels'),

  initialize: function() {
    irc.chatWindows.bind('add', this.addChannel, this);
  },

  addChannel: function(chat) {
    $(this.el).append(ich.channel({name: chat.name}));
  }

});