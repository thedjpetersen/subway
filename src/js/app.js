// Initial state of our app
app.initialized = false;

app.irc.connections = new app.collections.Connections();

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
  app.irc.connections.remove(data.connection);
});

app.io.on("restore_connection", function(data) {
  var conn = app.irc.connections;

  app.initialized = true;

  conn.reset(data);

  conn.active_server = conn.first().get("name");
  conn.active_channel = "status";

  var irc = new app.components.irc({
    collection: conn
  });

  irc.show();
  $(".mainMenu").addClass("hide");
});

app.io.on("raw", function(message) {
  util.handle_irc(message, app.irc.connections);
});
