app.components.UserList = React.createBackboneClass({
  render: function() {
    return (
      <div>
      </div>
    )
  }
});

app.components.irc = React.createBackboneClass({
  render: function() {
    var channel = this.getModel().getActiveChannel();

    // If we don't currently have a channel
    if (!channel) { return <div></div> }

    return (
      <div className="app">
        <app.components.Chat model={channel} />
      </div>
    );
  }
});
