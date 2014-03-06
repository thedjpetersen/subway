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
      var new_server = this.getModel().get("name");
      var new_channel = $(event.target).closest("li").attr("data-channel");

      // If we are just closing a channel
      if ($(event.target).hasClass("fa-times")) {
        if (new_server === connections.active_server &&
            new_channel === connections.active_channel)
        connections.active_channel = "status";
      } else {
        connections.active_server = new_server;
        connections.active_channel = new_channel;

        // Clear notifications highlights and unreads
        this.getModel().get("channels").get(connections.active_channel).clearNotifications();

        // If the our menu is not hidden we hide it now
        $(".mainMenu").addClass("hide");
      }

      connections.trigger("sort");
    },

    leave: function(event) {
      var target_channel = $(event.target).closest("li").attr("data-channel");

      if (target_channel.indexOf("#") === -1) {
        this.getModel().get("channels").remove(target_channel);
      } else {
        // Leave channel
        app.io.emit("command", {server: this.getModel().get("name"), target: target_channel, command: "leave"});
      }
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
                  <i className="fa fa-times" onClick={_this.leave}></i>
                </li>
              )
            })}
          </ul>
        </div>
      );
    }
  });

  var SideNav = React.createBackboneClass({
    componentDidUpdate: function() {
      showNavigation();
    },

    render: function() {
      return (
        <div className="sideNav">
          <div className="sideNavUp">
            <span className="spacing-right">More</span> 
            <i className="fa fa-level-up"></i>
          </div>
          {this.getModel().map(function(conn) {
            return <Connection model={conn} />
          })}
          <div className="sideNavDown">
            <span className="spacing-right">More</span> 
            <i className="fa fa-level-down"></i>
          </div>
        </div>
      );
    }
  });

  var showNavigation = function() {
    var element = $(".nav-area").get(0);
    // Show an indicator that there are more channels and info above
    // if the user scrolls from the top
    if (element.scrollTop !== 0) {
      $(".sideNavUp").css("left", "0");
    } else {
      $(".sideNavUp").css("left", "-195px");
    }

    // Show an indicator that there are more channels and info below
    if (element.scrollHeight === $(element).height() || $(element).height() + element.scrollTop === element.scrollHeight - 1 ) {
      $(".sideNavDown").css("left", "-195px");
    } else {
      $(".sideNavDown").css("left", "0");
    }
  }

  this.show = function() {
    var nav = SideNav({
      model: window.app.irc.connections
    });
    React.renderComponent(nav, $(".nav-area").get(0))

    $(".nav-area").scroll(showNavigation);

    var app = App({
      model: window.app.irc.connections
    });
    React.renderComponent(app, $("main").get(0))
  };
}
