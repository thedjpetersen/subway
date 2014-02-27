window.app = {
  models: {},
  collections: {},
  components: {},
  plugins: {},
  settings: {
    highlights: [],
    time_format: "HH:MM",
    plugins: {}
  },
  irc: {
  }
};

window.util = {
  // The raw argument is optional
  embedCss: function(css, isRaw) {
    var output_css = "";
    if(isRaw) {
      output_css = '<style type="text/css">' + css + "</style>";
    } else {
      output_css = '<style type="text/css" href="' + css + '"></style>';
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
    _.each(app.plugins, function(pluginMethod, pluginName, plugins) {
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

  loadPlugin: function(plugin) {
    var gist_id = plugin.split("/")[1];
    var base_url = "/plugin_cache/" + gist_id + "/";
    $.get(base_url + "plugin.json", function(data) {
      util.embedJs(base_url + "plugin.js");
      util.embedCss(base_url + "plugin.css");
      app.settings.plugins[data.pluginId] = data;
    });

  },

  loadPlugins: function(plugins) {
    plugins.map(function(plugin) {
      util.loadPlugin(plugin);
    });
  },

  // Check for highlights and set the text
  highlightText: function(message) {
    var connection = app.irc.connections.get(app.irc.connections.active_server);

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
      if(highlight.name === undefined) {
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
    var template = _.template(".highlight_<%= name %> { font-weight: bold; color: <%= color %>; }\n.unread_<%= name %> { background: <%= color %>; }\n");
    var output_css = "";
    _.each(app.settings.highlights, function(highlight, index, highlights) {
      if(highlight.name === undefined) {
        return;
      }
      output_css = output_css + template(highlight);
    });
    util.embedCss(output_css, true);
  }
};

app.io = io.connect(null, {port: document.location.port});
