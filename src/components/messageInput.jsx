/** @jsx React.DOM */

app.components.message_input = function() {
  var MessageInput = React.createBackboneClass({
    handleInput: function(ev) {
      // If the user pushed enter
      if (ev.keyCode === 13) {
        var server = app.irc.connections.get(app.irc.connections.active_server);
        var target = app.irc.connections.active_channel;

        var output = $(ev.target).val();
        // If the first character is a slash
        if (output[0] === "/" && output.indexOf("/me") !== 0) {
          // Stript the slash but emit the rest as a command
          app.io.emit("command", {server: server.get("name"), target: target, command: output.substring(1)});
        } else {
          output = output.replace("/me", '\u0001ACTION');
          app.io.emit("say", {text: output, server: server.get("name"), target: target});
          server.addMessage(target, {from: server.get("nick"), text: output, type: "PRIVMSG"});
        }
        $(ev.target).val("");
      }
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
