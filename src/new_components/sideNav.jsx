app.components.Channel = React.createBackboneClass({
  setActive: function() {
    // Hide server view/settings if showing
    app.irc.set("serverView", undefined);
    $(".menu").addClass("hide");

    this.getModel().setActive();
  },

  leave: function() {
    var channel = this.getModel().get("name");

    if (channel.indexOf("#") === -1) {
      // If it is a private message we just want to remove it
      this.getModel().collection.models[0].setActive();
      this.getModel().collection.remove(this.getModel());
    } else {
      app.io.emit("command", {server: this.getModel().getServerName(), target: this.getModel().get("name"), command: "leave"});
    }
  },

  render: function() {
    var _this = this;
    var chan = this.getModel();

    return (
      <div className="sideNav-channel" onClick={this.setActive}>
        <span className={app.irc.getActiveChannel() === chan ? "active" : ""}>{chan.get("name")}</span>

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
        {function() {
          if (chan.get("name") !== "status") {
            return <i className="fa fa-times pull-right" onClick={_this.leave}></i>
          }
        }()}
      </div>
    )
  }
});

app.components.Connection = React.createBackboneClass({
  serverDetails: function() {
    if (typeof app.irc.get("serverView") === "undefined") {
      app.irc.set("serverView", this.getModel().get("name"));
    } else {
      app.irc.set("serverView", undefined);
    }
  },

  render: function() {
    return (
      <div className="sideNav-connection">
        <strong onClick={this.serverDetails} className="pointer">{this.getModel().get("name")}</strong>
        {this.getModel().get("channels").map(function(chan) {
          return <app.components.Channel model={chan} />
        })}
      </div>
    )
  }
});

app.components.sideNav = React.createBackboneClass({
  render: function() {
    // Shorthand for connections
    var c = this.getCollection();
    return (
      <div>
        {c.map(function(conn) {
          return <app.components.Connection model={conn} />
        })}
      </div>
    )
  }
});
