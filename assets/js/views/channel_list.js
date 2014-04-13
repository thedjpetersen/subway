var TAB_WIDTH = 120;
var BTN_WIDTH = 34;

var ChannelListView = Backbone.View.extend({
  el: '#channels',

  events: {
    'click #slide-prev': 'slidePrev',
    'click #slide-next': 'slideNext',
  },

  newChannelBtn: null,

  initialize: function() {
    irc.chatWindows.bind('add', this.addChannel, this);
    $('.slide').css('display', 'inline-block');
    this.channelTabs = []
    this.newChannelBtn = new AddChannelView;
    $(this.el).after(this.newChannelBtn);
  },

  addChannel: function(chatWindow) {
    var $el = $(this.el);
    var view = new ChannelTabView({model: chatWindow});
    this.channelTabs.push(view);
    $el.append(view.render().el);

    var name = chatWindow.get('name');
    if(utils.isChannel(name[0]) || name === 'status'){
      view.setActive();

      if ($el.css('position') == 'fixed' && !(chatWindow.get('initial'))) {
        // MOBILE: navigate the tab list all the way to the right, to the
        // newest tab.
        $el.css('left', -1 * (this.channelTabs.length - 1) *
                 TAB_WIDTH + BTN_WIDTH + 'px');
      }
    }

    this.resetScrollbar();
  },

  scrollbarCreated: false,
  resetScrollbar: function () {
    var $el = $(this.el);

    if (this.channelTabs.length === 0) {
      return;
    }

    var maxHeight = $(window).height() - $el.offset().top - $('#add-channel-button').outerHeight();
    var channelClassName = '.' + ChannelTabView.prototype.className;
    var channelTabHeight = $(channelClassName).outerHeight();
    if (this.channelTabs.length * channelTabHeight > maxHeight) {
      $el.height(maxHeight);

      if (!this.scrollbarCreated) {
        this.scrollbarCreated = true;
        $el.perfectScrollbar({suppressScrollX: true});
      }

      // scroll to active tab
      var activeIndex = $(channelClassName).index($(channelClassName + '.active').get(0));
      $el.scrollTop(channelTabHeight * activeIndex);
      $el.perfectScrollbar('update');

      $(this.newChannelBtn.el).addClass('border-top');
    } else {
      $el.height('auto');
      if (this.scrollbarCreated) {
        $el.perfectScrollbar('destroy');
        this.scrollbarCreated = false;
      }
      $(this.newChannelBtn.el).removeClass('border-top');
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
