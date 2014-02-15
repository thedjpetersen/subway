/** @jsx React.DOM */

app.components.irc = function() {
  var User = React.createBackboneClass({
    render: function() {
      return (
        <div className="user">
          <span>{this.getModel().get("nick")}</span>
        </div>
      )
    }
  });
  
  var UserList = React.createBackboneClass({
    render: function() {
      return (
        <div className="userList">
          {this.getModel().map(function(user) {
            return <User model={user} />
          })}
        </div>
      );
    }
  });

  var TitleBar = React.createBackboneClass({
    render: function() {
      return (
        <div className="titlebar">
          <strong>{this.getModel().get("name")}</strong>
          <span>  {this.getModel().get("topic")}</span>
        </div>
      );
    }
  });

  var Message = React.createBackboneClass({
    render: function() {
      return (
        <div className="message">
          <div className="messageAuthor">
            {this.getModel().get("from")}
          </div>
          <div className="messageText">
            {this.getModel().get("text")}
          </div>
          <div className="messageTimestamp">
            {function(ctx) {
              var pad = function(str) { return ("0" + str).substr(-2) };
              var format = new Date(ctx.getModel().get("timestamp"));
              var output = pad(format.getHours()) + ":" + pad(format.getMinutes());
              return ctx.getModel().get("timestamp") ? output : "";
            }(this)}
          </div>
        </div>
      );
    }
  });

  var Messages = React.createBackboneClass({

    componentWillUpdate: function() {
      var node = this.getDOMNode();
      this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
    },

    componentDidUpdate: function() {
      if (this.shouldScrollBottom) {
        var node = this.getDOMNode();
        $(node).animate({scrollTop: node.scrollHeight}, 750);
      }
    },

    render: function() {
      return (
        <div className="messages">
          {this.getModel().map(function(message) {
            return <Message model={message} />
          })}
        </div>
      );
    }
  });

  var MessageInput = React.createBackboneClass({
    handleInput: function(ev) {
      // If the user pushed enter
      if (ev.keyCode === 13) {
        var server = app.irc.connections.get(app.irc.connections.active_server);
        var target = app.irc.connections.active_channel;

        var output = $(ev.target).val();
        // If the first character is a slash
        if (output[0] === "/") {
          // Stript the slash but emit the rest as a command
          app.io.emit("command", {server: server.get("name"), target: target, command: output.substring(1)});
        } else {
          app.io.emit("say", {text: output, server: server.get("name"), target: target});
          server.addMessage(target, {from: server.get("nick"), text: output, timestamp: Date.now()});
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

  var Chat = React.createBackboneClass({
    render: function() {
      return (
        <div className="chat">
          <TitleBar model={this.getModel()} />
          <Messages model={this.getModel().get("messages")} />
          <MessageInput />
        </div>
      )
    }
  });

  var App = React.createBackboneClass({
    getChannel: function() {
      var connections = this.getModel();
      var server = connections.get(connections.active_server);
      var channel = server.get("channels").get(connections.active_channel);
      return channel;
    },

    render: function() {
      return (
        <div className="app">
          <Chat model={this.getChannel()} />
          <UserList model={this.getChannel().get("users")} />
        </div>
      );
    }
  });

  var Connection = React.createBackboneClass({
    isActive: function(chan) {
      var connections = this.getModel().collection;
      // Check to see if the channel is currently the active one
      return (connections.active_server === this.getModel().get("name") &&
              connections.active_channel === chan.get("name"))
    },

    setActive: function(event) {
      var connections = this.getModel().collection;
      connections.active_server = this.getModel().get("name");
      connections.active_channel = $(event.target).attr("data-channel");
      connections.trigger("sort");
    },

    render: function() {
      var _this = this;
      return (
        <div className="nav_connection">
          <div className="server_name">
            <span>{this.getModel().get("name")}</span>
          </div>
          <div className="server_nick">
            <span>{this.getModel().get("nick")}</span>
          </div>
          <ul>
            {this.getModel().get("channels").map(function(chan) {
              return <li data-channel={chan.get("name")} onClick={_this.setActive} className={_this.isActive(chan) ? "active" : "" }>{chan.get("name")}</li>
            })}
          </ul>
        </div>
      );
    }
  });

  var SideNav = React.createBackboneClass({
    render: function() {
      return (
        <div>
          {this.getModel().map(function(conn) {
            return <Connection model={conn} />
          })}
        </div>
      );
    }
  });

  this.show = function() {
    var nav = SideNav({
      model: window.app.irc.connections
    });
    React.renderComponent(nav, $(".nav-area").get(0))

    var app = App({
      model: window.app.irc.connections
    });
    React.renderComponent(app, $("main").get(0))
  };
}
