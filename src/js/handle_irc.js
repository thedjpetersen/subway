var _ = typeof _ !== 'undefined' ? _ : require("underscore");
var util = typeof util !== 'undefined' ? util : {};

util.handle_irc = function(message, irc, app_ref) {
  console.log(message);
  var app = typeof window !== 'undefined' ? window.app : app_ref;
  var conn = irc.get("connections");

  // Alias the long namespace
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

        app.irc.set({
          active_server: message.client_server,
          active_channel: "status"
        });

        conn.addServer(message.client_server);

        // We a status channel for our new connection
        conn.first().addChannel("status");

        if (typeof module === 'undefined') {
          $(".mainMenu").addClass("hide");

          var irc = new app.components.irc({
            collection: conn
          });
          irc.show();
        }

      } else {
        if(conn.get(message.client_server) === undefined) {
          conn.addServer(message.client_server);
          server = conn.get(message.client_server);
          app.irc.set({
            active_server: message.client_server,
            active_channel: "status"
          });
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
      if (message.args[0].indexOf("#") === 0) {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(channel.get("name"), {from: message.nick, text: message.args[2], mode: message.args[1], type: "MODE"});
        switch (message.args[1]) {
          case "+o":
            channel.get("users").get(message.args[2]).set("type", "@");
            break;
          case "-o":
            channel.get("users").get(message.args[2]).set("type", "");
            break;
          default:
            break;
        }
      } else {
        //user mode message
        var user = message.args[0];

      }
      break;

    case "JOIN":
      // The first argument is the name of the channel
      if(message.nick === app.irc.getActiveNick()) {
        server.addChannel(message.args[0]);
        app.irc.set("active_channel", message.args[0]);
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
        app.irc.set("active_channel", "status");
        conn.trigger("sort");
      } else {
        var channel = server.get("channels").get(message.args[0]);
        server.addMessage(message.args[0], {type: "PART", nick: message.nick, text: message.args[1]});
        channel.get("users").remove(message.nick);
      }
      break;

    case "QUIT":
      server.get("channels").map(function(channel) {
        if (channel.get("users").get(message.nick)) {
          server.addMessage(channel.get("name"), {type: "QUIT", nick: message.nick, text: message.args[0]});
          channel.get("users").remove(message.nick);
        }
      });
      break;

    case "KICK":
      if(message.args[1] === server.get("nick")) {
        server.get("channels").remove(message.args[0]);
        app.irc.set("active_channel", "status");
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
      var isMe = false;
      // If it was us that changed our nick we want to change it here
      if (server.get("nick") === message.nick) {
        server.set("nick", message.args[0]);
        isMe = true;
        server.addMessage("status", {type: "NICK", nick: message.nick, text: message.args[0]});
      }

      // for each channel we are in
      // we want to change the nick of the user that has the new nick
      server.get("channels").map(function(channel) {
        var user = channel.get("users").get(message.nick);
        if (channel.get("users").get(message.nick)){
          user.set("nick", message.args[0]);
          if (!isMe) {
            server.addMessage(channel.get("name"), {type: "NICK", nick: message.nick, text: message.args[0]});
          }
        }
      });
      break;

    case "001":
      server.set({nick: _.first(message.args)});
      server.addMessage("status", {text: message.args[1], type: "NOTICE"});

      server.get("channels").each(function(channel) {
        if (channel.get("name").indexOf("#") !== -1) {
          server.get("channels").remove(channel.get("name"));
        }
      });
      break;

    case "002":
      server.addMessage("status", {text: message.args.join(" "), type: "NOTICE"});
      break;

    case "256":
    case "257":
    case "258":
    case "259":
    case "371":
      server.addMessage("status", {text: message.args[1], type: "NOTICE"});
      break;

    case "321":
      // rpl_liststart
      // args are username/channel/usersname
      server._list_store = [];
      break;

    case "322":
      server._list_store.push({
        channel: message.args[1],
        users: message.args[2],
        topic: message.args[3]
      });
      break;

    case "323":
      server.get("list").reset(server._list_store);
      server._list_store = [];
      break;

    // Set the topic
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
      server.set("motd", server.get("motd") + "\n" + message.args[1]);
      break;

    case "375":
      server.set("motd", message.args[1]);
      break;

    case "376":
      server.addMessage("status", {text: server.get("motd"), specialType: "MOTD"});
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
}

// to export our models code to work server side
if (typeof module !== 'undefined' && module.exports) {
  module.exports = util.handle_irc;
}
