var ChannelTabView = Backbone.View.extend({
  className: 'channel',

  events: {
    'click': 'setActive'
  },

  initialize: function() {
    this.model.stream.bind('add', this.updateUnreadCounts, this);
    this.model.bind('destroy', this.close, this);
  },

  render: function() {
    var tmpl = ich.channel({name: this.model.get('name')});
    $(this.el).html(tmpl);
    return this;
  },

  setActive: function() {
    irc.chatWindows.setActive(this.model);
    $(this.el).addClass('active').siblings().removeClass('active');
    this.removeUnread();
  },

  updateUnreadCounts: function(msg) {
    var unread = this.model.get('unread');
    var unreadMentions = this.model.get('unreadMentions');

    // TODO: do something more sensible here than remove/readd elements
    $(this.el).children('.unread, .unread_mentions').remove();

    if (unread > 0) {
      $(this.el).append(ich.unread({unread: unread}));
    }
    if (unreadMentions > 0) {
      $(this.el).append(ich.unread_mentions({unread_mentions: unreadMentions}));
    }
  },

  removeUnread: function() {
    $(this.el).children('.unread, .unread_mentions').remove();
    this.model.set({unread: 0, unreadMentions: 0});
  },

  close: function() {
    // Focus on next frame if this one has the focus
    if ($(this.el).hasClass('active')) {
      // Go to previous frame unless it's status
      if ($(this.el).prev().text().trim() !== 'status') {
        $(this.el).prev().click();
      } else {
        $(this.el).next().click();
      }
    }
    this.remove();
  }

});
