/** @jsx React.DOM */

app.components.message_input = function() {
  var MessageInput = React.createBackboneClass({
    handleInput: function(ev) {
      // If the user pushed enter
      var server = app.irc.connections.get(app.irc.connections.active_server);
      var target = app.irc.connections.active_channel;
      var channel = server.get("channels").get(target);
      var input = $(ev.target).val();

      if (ev.keyCode === 13) {
        var server = app.irc.connections.get(app.irc.connections.active_server);
        var target = app.irc.connections.active_channel;

        var input = $(ev.target).val();
        // If the first character is a slash
        if (input[0] === "/" && input.indexOf("/me") !== 0) {
          // Stript the slash but emit the rest as a command
          app.io.emit("command", {server: server.get("name"), target: target, command: input.substring(1)});
          if (input.indexOf("/msg") === 0 ) {
            var new_channel = input.split(" ")[1];
            server.addChannel(new_channel);
            server.addMessage(new_channel, {from: server.get("nick"), text: input.split(" ").splice(2).join(" ")});
          }
        } else {
          input = input.replace("/me", '\u0001ACTION');
          app.io.emit("say", {text: input, server: server.get("name"), target: target});
          server.addMessage(target, {from: server.get("nick"), text: input, type: "PRIVMSG"});
        }
        channel.get("history").push(input);
        $(ev.target).val("");
      }

      if (ev.keyCode === 9) {
        // handle tab complete
      }

      if (ev.keyCode === 38) {
        // handle up key
      }

      if (ev.keyCode === 40) {
        // handle down key
      }

      console.log(ev.keyCode);
    },

    render: function() {
      return (
        <div className="messageInput">
          <input onKeyUp={this.handleInput} />
          <a className="button">Send</a>
        </div>
      );
    }
  });

  return MessageInput;
}
