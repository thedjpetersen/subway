var AddChannelView = Backbone.View.extend({
  el: '#add-channel-button',
  inputId: '#channelname',

  events: {
    'click': 'enableButtonInput',
    'keyup :input': 'processKey',
    'blur :input': 'render',
  },

  initialize: function() {
    this.render();
  },

  enableButtonInput: function() {
    if (!$(this.inputId).is(":focus")){
      $(this.el).html(ich.add_new_channel_form());
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
