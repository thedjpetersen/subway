module.exports = function(client, data) {
  var args;
  if (data.command) {
    args = data.command.split(" ");
  } else {
    args = [""];
  }

  // If the arguments don't include the channel we add it
  var includeChannel = function(args) {
    if(args.length > 1) {
      if (args[1].indexOf("#") !== 0) {
        args.splice(1,0,data.target);
      }
    } else if (args.length === 1) {
      args.splice(1,0,data.target);
    }
    return args;
  };

  switch (args[0].toLowerCase()) {
    case "join":
      client.join(args[1]);
      break;

    case "leave":
      client.part(data.target, _.rest(args).join(" "));
      break;

    case "me":
      // Send a sentence
      client.action(data.target, args.slice(1).join(" "));
      break;

    case "msg":
      if (typeof socket.irc_conn !== "undefined") {
        var target_server = socket.irc_conn.get("connections")
        .get(client.opt.server);
        target_server.addChannel(args[1]);
        target_server.addMessage(args[1], {from: target_server.get("nick"), text: data.command.split(" ").splice(2).join(" ")});
      }

      client.say(args[1], args.slice(2).join(" "));
      break;

    case "part":
    case "kick":
    case "topic":
      args = includeChannel(args);
      client.send.apply(client, args);
      break;

    case "admin":
      client.send.apply(client, args);
      break;

    default:
      client.send.apply(client, args);
      break;
  }
}
