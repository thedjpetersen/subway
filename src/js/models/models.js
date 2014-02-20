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

  addMessage: function(channelName, message) {
    // If the channel doesn't exist this will add it
    this.addChannel(channelName);
    var channel = this.get("channels").get(channelName);

    // Handle action messages
    if(message.text.indexOf("ACTION ") === 1 ) {
      message.text = message.text.substring(8);
      message.type = "ACTION";
    }

    // Set message and activity
    var added_message = channel.get("messages").add(message);
    var user = channel.get("users").get(message.from);

    // If the user exists we need to set the users activty back to its
    // initial state
    if (user !== undefined) {
      user.resetActive();
      if (channel.get("name") === app.irc.connections.active_channel) {
        // Redraw the server list
        user.collection.trigger("add");
      }
    }

    // If we are not idling on the active channel we want to 
    // increment the number of unread messages in the server
    if(channel.get("name") !== app.irc.connections.active_channel && _.contains(["PRIVMSG"], message.type)) {
      if (!channel.get("unread")) {
        channel.set("unread", 0);
      }

      var unread = channel.get("unread");
      channel.set("unread", ++unread);

      util.checkHighlights(added_message, channel, this);
    }
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
  },

  getActiveNick: function() {
    var active_connection = this.get(this.active_server);
    return active_connection.get("nick");
  }
});

app.models.Channel = Backbone.Model.extend({
  idAttribute: "name",

  initialize: function() {
    this.attributes.messages = new app.collections.Messages();
    this.attributes.users = new app.collections.Users();
  },

  clearNotifications: function() {
    this.set("unread", 0);
    var _this = this;
    _.each(app.settings.highlights, function(highlight, index, highlights) {
      _this.set(highlight.name, 0);
    });
  }
});

app.collections.Channels = Backbone.Collection.extend({
  model: app.models.Channel
});

app.models.Message = Backbone.Model.extend({
  initialize: function() {
    var default_props = {
      timestamp: Date.now()
    };
    if (this.get("type") === undefined) {
      default_props.type = "PRIVMSG";
    }

    this.set(default_props);
  },

  getClass: function() {
    var classList = "message";
    if (this.get("from") === app.irc.connections.getActiveNick()) {
      classList = classList + " isMe";
    }
    return classList;
  },

  getText: function() {
    return util.highlightText(this);
  }
});

app.collections.Messages = Backbone.Collection.extend({
  model: app.models.Message
});

app.models.User = Backbone.Model.extend({
  idAttribute: "nick",

  initialize: function() {
    // If the user is the an admin we want to indicate it with the type
    if (this.get("nick").indexOf("@") !== -1) {
      this.set({
        nick: this.get("nick").substring(1),
        type: "@",
        updated: Date.now()
      });
    } else {
      this.set({
        type: "",
        updated: Date.now()
      });
    }
  },

  resetActive: function() {
    // Get rid of any existing counters we have
    clearInterval(this.active_counter);

    // Set active to 0
    this.set({
      last_active: 0,
      updated: Date.now()
    });

    var _this = this;
    this.active_counter = setInterval(function() {
      var active = _this.get("last_active");

      // If we are past an hour we set the user to idle
      if(active > 60) {
        _this.set("last_active", undefined);
        clearInterval(_this.active_counter);
      } else {
        _this.set("last_active", active+1);
      }
    }, 60000);
  },

  isActive: function() {
    return this.get("last_active") < 60 ? "activeUser" : "notActiveUser";
  },

  getActive: function() {
    var active = this.get("last_active");
    return active < 60 ? "(" + active + "m)" : "";
  }
});

app.collections.Users = Backbone.Collection.extend({
  model: app.models.User,

  comparator: function(user) {
    return [user.get("last_active")*-1, user.get("nick")];
  },

  sortAll: function() {
    return _.sortBy(this.sortBy("nick"), function(user) {
      return user.get("updated")*-1;
    });
  }
});
