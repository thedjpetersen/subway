var ChannelView = Backbone.View.extend({
  initialize: function(name) {
    this.model = new ChatWindow({name: name, view: this});
  },

  render: function() {
    $('.channels').append(this.model.name);
    return this;
  }
});
