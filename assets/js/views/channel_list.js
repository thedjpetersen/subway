var ChannelListView = Backbone.View.extend({
  el: '#channels',

  initialize: function() {
    irc.chatWindows.bind('add', this.addChannel, this);
    this.channelTabs = []
  },

  addChannel: function(chatWindow) {
    var view = new ChannelTabView({model: chatWindow});
    this.channelTabs.push(view);
    $(this.el).append(view.render().el);
    view.setActive();
  }
});
