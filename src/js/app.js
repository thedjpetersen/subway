// Initial state of our app
app.initialized = false;

app.irc = new app.models.App();

// Display startup menu
// TODO if the user is already logged in we need to connect them directly
// their session
// Or if in the server settings they are to be connected directly to a channel
// we need to immediately go into the connecting mode
var menu = new app.components.startMenu();
menu.show();

app.io.on("connect", function() {
  $.post("is_logged_in/", {socketid: app.io.socket.sessionid}, function(data) {
    if(data.logged_in) {
      app.user = new app.models.SubwayUser({
        username: data.username
      });
      menu.render();
    }

    if (data.logged_in && data.client_length !== 0 ) {
      $(".mainMenu").addClass("hide");
    }
  });
});

app.io.on("settings", function(settings) {
  // Add new settings and override default ones
  app.settings = _.extend(app.settings, settings);
  util.highlightCss();
  util.loadPlugins(settings.plugins);
});

app.io.on("connection_removed", function(data) {
  app.irc.get("connections").remove(data.connection);
});

app.io.on("restore_connection", function(data) {
  app.initialized = true;

  app.irc.set(_.omit(data, "connections"));

  app.irc.set({
    connections: new app.collections.Connections(data.connections)
  });

  var conn = app.irc.get("connections");

  var irc = new app.components.irc({
    collection: conn
  });

  irc.show();

  if(data.connections.length > 0) {
    $(".mainMenu").addClass("hide");
  }
});

app.io.on("raw", function(message) {
  util.handle_irc(message, app.irc);
});

app.io.on("history", function(data) {
  var server = app.irc.get("connections").get(data.server);
  var channel;
  if(data.channel.indexOf("#") === 0) {
    channel = server.get("channels").get(data.channel);
  } else {
    // For private messages
    channel = server.get("channels").get(data.channel.replace(server.get("nick"), "").replace("#", ""));
  }
  var messages = channel.get("messages");
  messages.add(data.messages, {at: 0});

  if (data.messages.length < 25) {
    messages.all_fetched = true;
  }
});
