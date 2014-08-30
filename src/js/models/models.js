var Backbone = typeof Backbone !== 'undefined' ? Backbone : require("backbone");
var _ = typeof _ !== 'undefined' ? _ : require("underscore");

var app = typeof app !== 'undefined' ? app : {models: {}, collections: {}};

var isNode = false;

if (typeof module !== 'undefined' && module.exports) {
  isNode = true;
}

app.models.App = Backbone.Model.extend({
  initialize: function(attrs, opts) {
    attrs = attrs || {};
    this.attributes.connections = new app.collections.Connections(attrs.connections || []);
    this.attributes.notifications = 0;
  },

  getActiveServer: function() {
    return this.get("connections").get(this.get("active_server"));
  },

  getActiveChannel: function() {
    return this.getActiveServer().get("channels").get(this.get("active_channel"));
  },

  getActiveNick: function() {
    return this.getActiveServer().get("nick");
  },

  setNotifications: function(num) {
    app.irc.attributes.notifications = app.irc.attributes.notifications+num;

    if(app.irc.attributes.notifications < 0) {
      app.irc.attributes.notifications = 0;
    }

    if(app.irc.attributes.notifications > 0) {
      document.title = "(" + app.irc.attributes.notifications + ") " + util.title;
    } else {
      document.title = util.title;
    }
  }

});

app.models.Connection = Backbone.Model.extend({
  idAttribute: "name",

  initialize: function(attrs, opts) {
    this.attributes.channels = new app.collections.Channels(attrs.channels || []);
    this.attributes.list = new app.collections.ChannelList(attrs.list || []);

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
    if(message.text && message.text.indexOf("ACTION ") === 1 ) {
      message.text = message.text.substring(8);
      message.type = "ACTION";
    }

    // Set message and activity
    var added_message = channel.get("messages").add(message);
    var user = channel.get("users").get(message.from);

    if (isNode) {
      app.logMessage(this.get("name"), channelName, added_message.attributes, app.username);
    }

    // If the user exists we need to set the users activty back to its
    // initial state
    if (user !== undefined) {
      user.resetActive();
      if (channel.get("name") === app.irc.get("active_channel")) {
        // Redraw the server list
        user.collection.trigger("add");
      }
    }

    // If we are not idling on the active channel we want to 
    // increment the number of unread messages in the server
    if(channel.get("name") !== app.irc.getActiveChannel().get("name") && _.contains(["PRIVMSG"], added_message.get("type"))) {
      if (!channel.get("unread")) {
        channel.set("unread", 0);
      }

      var unread = channel.get("unread");
      channel.set("unread", ++unread);

      if (typeof util !== "undefined") {
        util.checkHighlights(added_message, channel, this);
      }
    }
  },

  addUser: function(channel, user) {
    var users = this.get("channels").get(channel).get("users");

    // If the user already exists we don't want to add them
    if (!users.get(user)) {
      users.add(user);
    }
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

  // we don't want to return the messages with our json
  toJSON: function () {
    var ret_obj = _.extend({}, this.attributes);
    // Only save 25 messages
    ret_obj.messages.slice(0,24);
    return ret_obj;
  },

  initialize: function(attrs, opts) {
    this.attributes.messages = new app.collections.Messages(attrs.messages || []);
    this.attributes.users = new app.collections.Users(attrs.users || []);
    this.attributes.history = [];
    this.attributes.history_offset = 0;
  },

  getNextHistory: function() {
    var history = this.attributes.history;
    var offset = this.attributes.history_offset;
    var entry = history[offset];

    if(offset === history.length) {
      this.attributes.history_offset = 0;
    } else  {
      this.attributes.history_offset = offset+1;
    }
    return entry;
  },

  getPrevHistory: function() {
    var history = this.attributes.history;
    var offset = this.attributes.history_offset;

    if(offset === 0) {
      this.attributes.history_offset = history.length;
    } else  {
      this.attributes.history_offset = offset-1;
    }

    var entry = history[this.attributes.history_offset-1];
    return entry;
  },

  clearNotifications: function() {
    this.set("unread", 0);
    var _this = this;
    var count;
    if (typeof app.settings !== "undefined") {
      _.each(app.settings.highlights, function(highlight, index, highlights) {
        count = _this.get(highlight.name) || 0;
        app.irc.setNotifications(count*-1);
        _this.set(highlight.name, 0);
      });
    } else {
      _.each(this.attributes, function(val, key) {
        // Set any highlights to 0 as well
        if (typeof val === "number" && val > 0) {
          _this.set(key, 0);
        }
      });
    }

    if (typeof app.user !== 'undefined') {
      app.io.emit("clearnotifications", {
        server: app.irc.getActiveServer(),
        channel: this.get("name")
      });
    }
  },


  isPm: function() {
    return this.get("name").indexOf("#") === -1;
  }
});

app.collections.Channels = Backbone.Collection.extend({
  model: app.models.Channel
});

app.models.Message = Backbone.Model.extend({
  initialize: function(attrs, options) {
    var default_props = {
      timestamp: attrs.timestamp || Date.now()
    };
    if (this.get("type") === undefined) {
      default_props.type = "PRIVMSG";
    }

    this.set(default_props);
  },

  isMe: function() {
    return this.get("from") === app.irc.getActiveNick();
  },

  getAuthor: function() {
    return this.get("from");
  },

  getClass: function() {
    var classList = "message";
    if (this.isMe()) {
      classList = classList + " isMe";
    }

    if (this.get("specialType") === "MOTD") {
      classList = classList + " motd";
    }
    return classList;
  },

  pmToMe: function(channel) {
    return channel.isPm() && channel.get("name") === this.getAuthor();
  },

  getText: function() {
    // Highlight any mentions or other regexes
    var text = util.highlightText(this);

    // Apply any loaded plugins to the message
    text = util.applyPlugins(text);
    return text;
  }
});

app.collections.Messages = Backbone.Collection.extend({
  model: app.models.Message
});

app.models.User = Backbone.Model.extend({
  idAttribute: "nick",

  initialize: function(attrs, options) {
    // If the user is the an admin we want to indicate it with the type
    if (this.get("nick").indexOf("@") !== -1 || attrs.type === "@") {
      this.set({
        nick: this.get("nick").replace("@", ""),
        type: "@",
        updated: attrs.updated || Date.now()-3600000,
      });
    } else {
      this.set({
        type: "",
        updated: attrs.updated || Date.now()-3600000,
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
    // Sort users alphabetically
    var users = this.sortBy(function(user) {
      return user.get("nick").toLowerCase();
    });

    // Sort users by whether or not they are an operator
    users = _.sortBy(users, function(user) {
      return user.get("type") === "@" ? -1 : 1;
    });

    // Sort users by whether by when they were updated
    users = _.sortBy(users, function(user) {
      var active = user.get("last_active");
      return active < 60 ? user.get("updated")*-1 : active;
    });

    return users;
  }
});

app.models.SubwayUser = Backbone.Model.extend({
});

app.collections.ChannelList = Backbone.Collection.extend({
});

// to export our models code to work server side
if (isNode) {
  module.exports = app;
}
