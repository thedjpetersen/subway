app.components.Channel = React.createBackboneClass({
  setActive: function() {
    this.getModel().setActive();
  },

  render: function() {
    var chan = this.getModel();

    return (
      <div className="sideNav-channel" onClick={this.setActive}>
        <span>{chan.get("name")}</span>

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
        <i className="fa fa-times pull-right" onClick={this.leave}></i>
      </div>
    )
  }
});

app.components.Connection = React.createBackboneClass({
  render: function() {
    return (
      <div className="sideNav-connection">
        <strong>{this.getModel().get("name")}</strong>
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
