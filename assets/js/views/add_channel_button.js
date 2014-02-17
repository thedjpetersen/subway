var AddChannelView = Backbone.View.extend({
  el: '#add-channel-button',

  inputOn: false,

  events: {
    'click': 'enableButtonInput',
    'keyup :input': 'processKey',
    'blur :input': 'disableButtonInput',
  },

  initialize: function() {
    this.render();
  },

  enableButtonInput: function() {
    if (!this.inputOn) {
      $(this.el).html(ich.add_new_channel_form());
      this.inputOn = true;
    }
  },

  disableButtonInput: function() {
    if (this.inputOn) {
      this.render();
      this.inputOn = false;
    }
  },

  processKey: function (event) {
    if (event.which == 13) { // enter key
      irc.socket.emit('join', event.target.value);
    }
    return false;
  },

  render: function(){
    $(this.el).html(ich.add_new_channel());
    return this;
  }

});
