// Initial state of our app
app.initialized = false;

// Display startup menu
// TODO if the user is already logged in we need to connect them directly
// their session
// Or if in the server settings they are to be connected directly to a channel
// we need to immediately go into the connecting mode
var menu = new app.components.startMenu();
menu.show();

app.irc.connections = new app.collections.Connections();

app.io.on("settings", function(settings) {
  app.settings = settings;
  util.highlightCss();
});

app.io.on("raw", function(message) {
  // Alias the long namespace
  var conn = app.irc.connections;
  var server = conn.get(message.client_server);

  // For debugging purposes
  if (message.rawCommand !== "PING") {
    console.log(message);
  }

  switch (message.rawCommand) {
    // We ignore PING messages - in the future
    // maybe we these are important for timeout purposes?
    case "PING":
      break;

    case "NOTICE":
      // If our app is not initialized we need to start it now
      if (!app.initialized && message.client_server) {
        app.initialized = true;
        menu.hide();

        conn.active_server = message.client_server;
        conn.active_channel = "status";

        conn.addServer(message.client_server);

        // We a status channel for our new connection
        conn.first().addChannel("status");

        var irc = new app.components.irc({
          collection: conn
        });

        irc.show();
      } else {
        server.addMessage("status", {from: "", text: message.args[1]});
      }
      break;

    case "PRIVMSG":
      // If we have a message addressed to a server
      if (message.args[0][0] === "#") {
        server.addMessage(message.args[0], {from: message.nick, text: message.args[1], timestamp: Date.now()});
      } else {
        // Deal with a private message
        server.addMessage(message.nick, {from: message.nick, text: message.args[1], timestamp: Date.now()});
      }
      break;

    case "JOIN":
      // The first argument is the name of the channel
      server.addChannel(message.args[0]);
      break;

    case "001":
      server.set({nick: _.first(message.args)});
      server.addMessage("status", {text: message.args[1]});
      break;

    case "002":
      server.addMessage("status", {text: message.args.join(" ")});
      break;

    case "332":
      server.get("channels").get(message.args[1]).set("topic", message.args[2]);
      break;

    case "333":
      // This has the topic user and the topic creation date
      // args [0: user 1: channel 2: user who set topic 3: topic timestamp]
      break;

    case "353":
      // We have to trim for leading and trailing whitespace
      var usernames = message.args[3].trim().split(" ");
      usernames = _.map(usernames, function(u) {
        return {nick: u};
      });
      server.addUser(message.args[2], usernames);
      break;

    case "372":
      server.addMessage("status", {text: message.args[1]});
      break;

    case "433":
      server.addMessage("status", {text: "Error " + message.args.join(" ")});
      break;

    default:
      break;
  }
});
