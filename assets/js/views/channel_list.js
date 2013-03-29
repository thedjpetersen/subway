var TAB_WIDTH = 120;
var BTN_WIDTH = 34;

var ChannelListView = Backbone.View.extend({
  el: '#channels',

  events: {
    'click #slide-prev': 'slidePrev',
    'click #slide-next': 'slideNext'
  },

  initialize: function() {
    irc.chatWindows.bind('add', this.addChannel, this);
    $('.slide').css('display', 'inline-block');
    $('#join-channel-name').bind({
      keyup: function(event) {
        if (event.keyCode == 13) {
          event.preventDefault();
          irc.socket.emit('join', $('#join-channel-name').val());
          $('#join-channel-name').val('');
        }
      },
      keydown: function(event) {
        if (event.keyCode == 13) {
          event.preventDefault();
        }
      }
    });
    $('#join-channel').css('display', 'block');
    this.channelTabs = []
  },

  addChannel: function(chatWindow) {
    var $el = $(this.el);
    var view = new ChannelTabView({model: chatWindow});
    this.channelTabs.push(view);
    $el.prepend(view.render().el);

    var name = chatWindow.get('name');
    if(name[0] === '#' || name === 'status'){
      view.setActive();

      if ($el.css('position') == 'fixed' && !(chatWindow.get('initial'))) {
        // MOBILE: navigate the tab list all the way to the right, to the
        // newest tab.
        $el.css('left', -1 * (this.channelTabs.length - 1) *
                 TAB_WIDTH + BTN_WIDTH + 'px');
      }
    }
  },

  slidePrev: function() {
    // MOBILE: slide the tab list left, but don't let first tab hit the left.
    var that = this;
    setTimeout(function() {
        var $el = $(that.el);
        if ($el.css('position') != 'fixed') { return; }

        var left = parseInt($el.css('left'), 10);
        if (left < BTN_WIDTH) {
          $el.animate({'left': left + TAB_WIDTH + 'px'}, 100);
        }
    }, 200);
  },

  slideNext: function() {
    // MOBILE: slide the tab list right, but don't go farther than last tabs.
    var that = this;
    setTimeout(function() {
        var $el = $(that.el);
        if ($el.css('position') != 'fixed') { return; }

        var left = parseInt($el.css('left'), 10);
        if (left >= -1 * (that.channelTabs.length - 2) * TAB_WIDTH) {
            $el.animate({'left': left - TAB_WIDTH + 'px'}, 100);
        }
    }, 200);
  },

});
