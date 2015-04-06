// Initial state of our app
app.initialized = false;

app.irc = new app.models.App();

// Display startup menu
// TODO if the user is already logged in we need to connect them directly
// their session
// Or if in the server settings they are to be connected directly to a channel
// we need to immediately go into the connecting mode
app.io.on("connect", function() {
  React.render(React.createElement(app.components.Menu, {}), document.querySelectorAll("div.menu")[0]);

  // If we have default servers we want to hide the menu
  // and show the loading servers message
  /*
  if(app.default_servers && _.isUndefined(app.user)) {
    $(".mainMenu").toggleClass("hide");
    $("main").html(app.loading_template);
  }
 */

  /*
  util.loadPlugins(app.settings.plugins);
  util.highlightCss();
 */
});

app.io.on("connection_removed", function(data) {
  app.irc.get("connections").remove(data.connection);
});

app.io.on("register_success", function(data) {
});

app.io.on("raw", function(message) {
  util.handle_irc(message, app.irc);
});

app.io.on("disconnect", function(data) {
  console.log("disconnected");
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
