var ChannelTabView = Backbone.View.extend({
  className: 'channel',

  events: {
    'click': 'setActive',
    'click .close-button': 'close'
  },

  initialize: function() {
    this.model.stream.bind('add', this.updateUnreadCounts, this);
    this.model.bind('destroy', this.switchAndRemove, this);
  },

  render: function() {
    var self = this;
    var tmpl = ich.channel({
      name: this.model.get('name'),
      notStatus: function() {
        return self.model.get('type') !== 'status';
      }
    });
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

  close: function(e) {
    e.stopPropagation();
    if (this.model.get('type') === 'channel')
      irc.socket.emit('part', this.model.get('name'));
    else
      this.model.destroy();
  },

  switchAndRemove: function() {
    var $nextTab;
    // Focus on next frame if this one has the focus
    if ($(this.el).hasClass('active')) {
      // Go to previous frame unless it's status
      if ($(this.el).next().length) {
        $nextTab = $(this.el).next();
      } else {
        $nextTab = $(this.el).prev();
      }
    }
    this.remove();
    $nextTab.click();
  }

});
