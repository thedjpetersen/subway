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
  util.loadPlugins(settings.plugins);
});

app.io.on("plugin_added", function(data) {
  util.loadPlugin(data.plugin);
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
        if(conn.get(message.client_server) === undefined) {
          conn.addServer(message.client_server);
          server = conn.get(message.client_server);
        }
        server.addMessage("status", {from: "", text: message.args[1], type: "NOTICE"});
      }
      break;

    case "PRIVMSG":
      // If we have a message addressed to a server
      if (message.args[0][0] === "#") {
        server.addMessage(message.args[0], {from: message.nick, text: message.args[1], type: "PRIVMSG"});
      } else {
        // Deal with a private message
        server.addMessage(message.nick, {from: message.nick, text: message.args[1], type: "PRIVMSG"});
      }
      break;

    case "MODE":
      break;

    case "JOIN":
      // The first argument is the name of the channel
      if(message.nick === app.irc.connections.getActiveNick()) {
        server.addChannel(message.args[0]);
        conn.active_channel = message.args[0];
        conn.trigger("sort");
      } else {
        server.addMessage(message.args[0], {type: "JOIN", nick: message.nick});
        var channel = server.get("channels").get(message.args[0]);
        channel.get("users").add({nick: message.nick});
      }
      break;

    case "PART":
      if(message.nick === server.get("nick")) {
        server.get("channels").remove(message.args[0]);
        conn.active_channel = "status";
        conn.trigger("sort");
      } else {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(message.args[0], {type: "PART", nick: message.nick, text: message.args[1]});
        channel.get("users").remove(message.nick);
      }
      break;

    case "KICK":
      if(message.args[1] === server.get("nick")) {
        server.get("channels").remove(message.args[0]);
        conn.active_channel = "status";
        server.addMessage('status', {type: "KICK", nick: message.nick, text: message.args[1], reason: message.args[2]});
        conn.trigger("sort");
      } else {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(message.args[0], {type: "KICK", nick: message.nick, text: message.args[1], reason: message.args[2]});
        channel.get("users").remove(message.nick);
      }
      break;


    case "TOPIC":
      server.addMessage(message.args[0], {type: "TOPIC", nick: message.nick, text: message.args[1]});

      var channel = server.get("channels").get(message.args[0]);
      channel.set("topic", message.args[1]);
      break;

    case "NICK":
      server.get("channels").map(function(channel) {
        var user = channel.get("users").get(message.nick);
        if (channel.get("users").get(message.nick)){
          user.set("nick", message.args[0]);
          server.addMessage(channel.get("name"), {type: "NICK", nick: message.nick, text: message.args[0]});
        }
      });
      break;

    case "001":
      server.set({nick: _.first(message.args)});
      server.addMessage("status", {text: message.args[1], type: "NOTICE"});
      break;

    case "002":
      server.addMessage("status", {text: message.args.join(" "), type: "NOTICE"});
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

    case "474":
      server.addMessage("status", {text: message.args[1] + " " + message.args[2]});
      break;

    default:
      // Generic handler for irc errors
      if (message.commandType === "irc_error") {
        server.addMessage("status", {text: message.args.join(" - ")});
      }
      break;
  }
});
