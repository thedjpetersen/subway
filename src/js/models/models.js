app.models.Connection = Backbone.Model.extend({
  idAttribute: "name",

  initialize: function() {
    this.attributes.channels = new app.collections.Channels();

    // When we have an update on the model we want to bubble the change
    // on up to the connection
    this.attributes.channels.on("all", function()  {
      this.trigger("change");
    }, this);
  },

  addChannel: function (channel) {
    if (this.get("channels").get(channel) === undefined) {
      this.get("channels").add({name: channel});
    }
  },

  addMessage: function(channel, message) {
    // If the channel doesn't exist this will add it
    this.addChannel(channel);

    this.get("channels").get(channel).get("messages").add(message);
  },

  addUser: function(channel, user) {
    this.get("channels").get(channel).get("users").add(user);
  }

});

app.collections.Connections = Backbone.Collection.extend({
  idAttribute: "name",

  model: app.models.Connection,

  addServer: function(server) {
    if (_.isEmpty(this.where({name: server}))) {
      this.add({name: server});
    }
  }
});

app.models.Channel = Backbone.Model.extend({
  idAttribute: "name",

  initialize: function() {
    this.attributes.messages = new app.collections.Messages();
    this.attributes.users = new app.collections.Users();
  }
});

app.collections.Channels = Backbone.Collection.extend({
  model: app.models.Channel
});

app.models.Message = Backbone.Model.extend({
});

app.collections.Messages = Backbone.Collection.extend({
  model: app.models.Message
});

app.models.User = Backbone.Model.extend({
  idAttribute: "nick"
});

app.collections.Users = Backbone.Collection.extend({
  model: app.models.User
});
