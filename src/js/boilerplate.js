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

window.util = {
  // The raw argument and class argument are optional
  embedCss: function(css, isRaw, cssClass) {
    var output_css = "";
    cssClass = cssClass || "";

    if(isRaw) {
      output_css = '<style type="text/css" class="' + cssClass + '">' + css + "</style>";
    } else {
      output_css = '<style type="text/css" href="' + css + '" class="' + cssClass + '"></style>';
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
      app.settings.active_plugins.push(data.pluginId);

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

    plugins.map(function(plugin) {
      util.loadPlugin(plugin);
    });
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
      var re = new RegExp(_.template(highlight.regex, {message: message, channel: undefined, connection: connection}), "g");
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
      var re = new RegExp(_.template(highlight.regex, {message: message, channel: undefined, connection: connection}), "g");

      if (text.search(re) !== -1) {
        channel.set(highlight.name, ++num);
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
          for(x=0; x<10; x++) {
            if(_this.queue.length === 0) {
              clearInterval(this.queueInt);
              break;
            } else {
              var entry = _this.queue.pop();
              var processedText = entry.getModel().getText();
              $(entry.getDOMNode()).find(".messageText").html(processedText.text);
              entry.attachListeners(processedText);
            }
          }
        }, 50);
      }
    }
  }
};

app.io = io.connect(null, {port: document.location.port});
