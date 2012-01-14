var ChannelListView = Backbone.View.extend({
  el: '#channels',

  initialize: function() {
    console.log('channel list init');
    irc.chatWindows.bind('add', this.addChannel, this);
  },

  addChannel: function(chat) {
    console.log('channel added to list');
    var view = new ChannelTabView({model: chat});
    $(this.el).append(view.render().el);
    irc.chatWindows.setActive(chat);
    view.setActive();
  }
});
