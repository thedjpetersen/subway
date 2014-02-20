/** @jsx React.DOM */

app.components.irc = function() {
  var Messages = app.components.messages();
  var UserList = app.components.user_list();
  var MessageInput = app.components.message_input();

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
      connections.active_channel = $(event.target).closest("li").attr("data-channel");

      // Clear notifications highlights and unreads
      this.getModel().get("channels").get(connections.active_channel).clearNotifications();

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
              return (
                <li data-channel={chan.get("name")} onClick={_this.setActive} className={_this.isActive(chan) ? "active" : "" }>
                  {chan.get("name")}
                  {function() {
                    if (chan.get("unread")) {
                      return (
                        <span className="unread">{chan.get("unread")}</span>
                      )
                    }
                  }()}
                  {app.settings.highlights.map(function(highlight) {
                    if (chan.get(highlight.name)) {
                      return (
                        <span className={"unread_" + highlight.name + " unread_highlight" }>{chan.get(highlight.name)}</span>
                      )
                    }
                  })}
                </li>
              )
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
