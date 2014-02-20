window.app = {
  models: {},
  collections: {},
  components: {},
  settings: {
    highlights: [],
    time_format: "HH:MM"
  },
  irc: {
  }
};

window.util = {
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
    output_css = '<style type="text/css">' + output_css + "</style>";
    $("head").append(output_css);
  }
};

app.io = io.connect(null, {port: document.location.port});
