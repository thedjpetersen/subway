/** @jsx React.DOM */

app.components.message_input = function() {
  var MessageInput = React.createBackboneClass({
    keyDown: function(ev) {
      // handle tabKey and autocompletion
      if (ev.keyCode === 9) {
        var server = app.irc.getActiveServer();
        var channel = app.irc.getActiveChannel();

        var sentence = ev.target.value.split(" ");
        ev.target.focus();
        ev.preventDefault();

        // Variable to keep track of
        if(!this.tabMode) {
          this.tabMode = true;
          this.userOffset = 0;
          this.partialMatch = new RegExp(sentence.pop(), "i");
        } else {
          // Remove last unsuccessful match
          // increment our user count
          if (sentence.length === 2 && sentence[1] !== "") {
            sentence = [];
          } else {
            sentence.pop();
          }
        }

        // Filter our channels users to the ones that start with our
        // partial match
        var _this = this;
        var users = channel.get("users").filter(function(user) {
          return (user.get("nick").search(_this.partialMatch) === 0 &&
                  user.get("nick") !== server.get("nick"));
        });

        if (this.userOffset >= users.length) {
          this.userOffset = 0;
        }

        if (users.length) {
          sentence.push(users[this.userOffset].get('nick'));
          if (sentence.length === 1) {
            ev.target.value = sentence.join(' ') + ": ";
          } else {
            ev.target.value = sentence.join(' ');
          }
        }

        ++this.userOffset;
      } else {
        this.tabMode = false;
      }
    },

    handleInput: function(ev) {
      // If the user pushed enter
      var server = app.irc.getActiveServer();
      var channel = app.irc.getActiveChannel();
      var target = channel.get("name");

      var input = ev.target.value;

      if (input === "") {
        return;
      }

      if (ev.keyCode === 13) {
        input = ev.target.value;

        // If the first character is a slash
        if (input[0] === "/" && input.indexOf("/me") !== 0) {
          // Stript the slash but emit the rest as a command
          app.io.emit("command", {server: server.get("name"), target: target, command: input.substring(1)});
          if (input.indexOf("/msg") === 0 ) {
            var new_channel = input.split(" ")[1];
            server.addChannel(new_channel);
            server.addMessage(new_channel, {from: server.get("nick"), text: input.split(" ").splice(2).join(" ")});
          }
        } else if(input.indexOf("/me") === 0) {
          app.io.emit("command", {server: server.get("name"), target: target, command: input.substring(1)});
          server.addMessage(target, {from: server.get("nick"), text: input.replace("/me", '\u0001ACTION'), type: "PRIVMSG"});
        } else {
          app.io.emit("say", {server: server.get("name"), target: target, text: input});
          server.addMessage(target, {from: server.get("nick"), text: input, type: "PRIVMSG"});
        }
        channel.get("history").push(input);
        ev.target.value = "";
      }

      if (ev.keyCode === 38) {
        // handle up key
        ev.target.value = channel.getNextHistory();
      }

      if (ev.keyCode === 40) {
        // handle down key
        ev.target.value = channel.getPrevHistory();
      }
    },

    render: function() {
      return (
        <div className="messageInput">
          <input ref="messageInput" onKeyDown={this.keyDown} onKeyUp={this.handleInput} placeholder="You type here..."/>
        </div>
      );
    }
  });

  return MessageInput;
}
