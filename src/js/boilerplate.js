window.app = {
  models: {},
  collections: {},
  components: {},
  plugins: {},
  plugin_data: {},
  plugin_registry: {},
  settings: {
    highlights: [],
    time_format: "HH:MM",
    active_plugins: [
    ]
  },
};

// Write our client settings to the defaults
_.extend(window.app.settings, window.subway_settings);

window.util = {
  title: document.title,

  // The raw argument and class argument are optional
  embedCss: function(css, isRaw, cssClass) {
    var output_css = "";
    cssClass = cssClass || "";

    if(isRaw) {
      output_css = '<style type="text/css" class="' + cssClass + '">' + css + "</style>";
    } else {
      output_css = '<link rel="stylesheet" href="' + css + '"></style>';
    }
    $("head").append(output_css);
  },

  embedJs: function(js, isRaw) {
    var output_js = "";
    if(isRaw) {
      output_js = '<script>' + js + "</script>";
    } else {
      output_js = '<script src="' + js + '"></script>';
    }
    $("body").append(output_js);
  },

  applyPlugins: function(text) {
    var listeners = [];
    // Iterate over all the plugins and apply them to the text
    _.each(app.settings.active_plugins, function(pluginName) {
      var pluginMethod = app.plugins[pluginName];
      var args = pluginMethod(text);

      if (typeof args === "string") {
        text = args;
      } else {
        // Set our text the text after it is processed by the plugin
        text = args.text;
      }

      if (args.listener) {
        listeners.push(args.listener);
      }

    });
    return {text: text, listeners: listeners};
  },

  loadPlugin: function(plugin, cb) {
    var gist_id = plugin.split("/")[1];
    var base_url = "plugin_cache/" + gist_id + "/";
    $.get(base_url + "plugin.json", function(data) {
      util.embedJs(base_url + "plugin.js");
      util.embedCss(base_url + "plugin.css");
      app.plugin_data[data.pluginId] = data;
      app.settings.active_plugins = _.union(app.settings.active_plugins, [data.pluginId]);

      if (cb) {
        cb.call(this);
      }
    });
  },

  loadPlugins: function(plugins) {
    // We also want to load our plugin registry at the same time
    $.getJSON("plugin_cache/plugins.json", function(data) {
      app.plugin_registry = data;
    });

    if (typeof plugins !== "undefined") {
      plugins.map(function(plugin) {
        util.loadPlugin(plugin);
      });
    }
  },

  // Check for highlights and set the text
  // Takes a message as an argument and returns HTML
  highlightText: function(message) {
    var connection = app.irc.getActiveServer();

    var text = _.escape(message.get("text"));
    var template = _.template("<span class=\"highlight highlight_<%= name %>\">$&</span>");

    _.each(app.settings.highlights, function(highlight, index, highlights) {
      if(highlight.name === undefined) {
        return;
      }
      var re = new RegExp(_.template(highlight.regex)({message: message, channel: undefined, connection: connection}), "g");
      text = text.replace(re, template(highlight));
    });
    return text;
  },

  checkHighlights: function(message, channel, connection) {
    var text = message.get("text");

    _.each(app.settings.highlights, function(highlight, index, highlights) {
      if(!highlight.name || !highlight.regex) {
        return;
      }

      var num = channel.get(highlight.name) || 0;
      var re = new RegExp(_.template(highlight.regex)({message: message, channel: undefined, connection: connection}), "g");

      if (text.search(re) !== -1) {
        channel.set(highlight.name, ++num);

        if(highlight.notify) {
          app.irc.setNotifications(1);
          util.displayNotification(channel.get("name"), message.get("from") + ": " + message.get("text"));
          util.playSound("message");
        }
      }

      if (channel.get("name") !== app.irc.get("active_channel") && app.settings.notify_pm && message.pmToMe(channel)) {
        util.displayNotification(channel.get("name") + " (pm)", message.get("text"));
        util.playSound("newPm");
      }
    });
  },

  highlightCss: function() {
    // Remove any old css styles
    if ($(".highlightCss").length) {
      $(".highlightCss").remove();
    }

    var template = _.template(".highlight_<%= name %> { font-weight: bold; color: <%= color %>; }\n.unread_<%= name %> { background: <%= color %>; }\n");
    var output_css = "";
    _.each(app.settings.highlights, function(highlight, index, highlights) {
      // If the highlight name is
      if(!highlight.name) {
        return;
      }
      output_css = output_css + template(highlight);
    });
    util.embedCss(output_css, true, "highlightCss");
  },

  renderQueue: {
    queue: [],

    clearQueue: function() {
      clearInterval(this.queueInt);
      this.queueInt = undefined;
      this.queue = [];
    },

    pushQueue: function(message) {
      var _this = this;

      this.queue.push(message);

      if(this.queueInt === undefined) {
        var x;
        this.queueInt = setInterval(function() {
          // Render ten messages and then wait 50 milliseconds
          // then render ten more messages
          // this allows us to switch channels quickly
          var mess = document.getElementsByClassName("messages")[0];

          for(x=0; x<10; x++) {
            if(_this.queue.length === 0) {
              clearInterval(this.queueInt);
              break;
            } else {
              var entry = _this.queue.pop();
              var processedText = entry.getModel().getText();
              // we need to evaluate if the messages is scrolled to the bottom
              // and then stay there if we are there
              var is_at_bottom = mess.scrollTop + mess.offsetHeight === mess.scrollHeight;

              $(entry.getDOMNode()).find(".messageText").html(processedText.text);

              if(is_at_bottom) {
                mess.scrollTop = mess.scrollHeight;
              }

              entry.attachListeners(processedText);
            }
          }
        }, 50);
      }
    }
  },

  // Display a desktop notification. 
  displayNotification: function(title, body) {
    var icon = '/img/subway.png';
    if ("Notification" in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {body: body, icon: icon});
      }
    }
  },

  playSound: function(type) {
    util.sounds && util.sounds[type].play();
  },

  _loadSound: function(name) {
    var a = new Audio();
    a.src = '/sounds/' + name + '.' + this._supportedFormat();
    return a;
  },

  // Detect supported HTML5 audio format
  _supportedFormat: function() {
    var a = document.createElement('audio');
    if (!a.canPlayType) return false;
    else if (!!(a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')))
      return 'ogg'
    else if (!!(a.canPlayType('audio/mpeg;').replace(/no/, '')))
      return 'mp3'
  },

};

util.sounds = {
  newPm: util._loadSound('new-pm'),
  message: util._loadSound('msg')
};

// Notifications.
// Check if the browser supports notifications
if ("Notification" in window) {
  // build title and body for the notification saying subway has notifications
  var title = 'Notifications from Subway';
  var body = 'Subway will display notifications like this for this session';

  // We display a notification saying that subway will use notifications.
  // On Chrome this is also a way of requesting permission to display notifications.
  if (Notification.permission !== 'denied') {
    // We have to bind the function to `this` to be able to access this.displayNotification
    Notification.requestPermission(function (permission) {
      if (!('permission' in Notification)) {
        Notification.permission = permission;
      }
    });
  }
}

// please note, that IE11 now returns true for window.chrome
var isChromium = window.chrome,
    vendorName = window.navigator.vendor;
if(isChromium !== null && vendorName === "Google Inc." && Notification.permission !== 'granted') {
   // is Google chrome 
  var notif = $("<div class=\"notificationCheck\">Click to show notifications</div>")
  .appendTo("body")
  .click(function(ev) {
    Notification.requestPermission(function (permission) {
      if (!('permission' in Notification)) {
        Notification.permission = permission;
      }
    });
    $(this).remove();
  });

  setTimeout(function() {
    notif.slideUp(400, function(){
      $(this).remove();
    });
  }, 5000);
}

app.loading_template = _.template("<div class=\"loading_default\"><strong>Loading default channels...</strong><br/><img src=\"/img/bubbles.svg\"/></div>")();

app.io = io(null, {port: document.location.port});
