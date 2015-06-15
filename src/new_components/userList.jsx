app.components.User = React.createBackboneClass({
  openPm: function() {
    var server = app.irc.getActiveServer();
    var nick = this.getModel().get("nick");

    // You can not PM yourself
    if(nick === server.get("nick")) {
      return;
    }

    // Add channel and activate it
    server.addChannel(nick);
    server.get("channels").get(nick).setActive();
  },

  render: function() {
    return (
      <div className="user">
        <span className={this.getModel().isActive() + " pointer"} onClick={this.openPm}>{this.getModel().get("type")}{this.getModel().get("nick")}</span>
        <span className="lastActive">{this.getModel().getActive()}</span>
      </div>
    )
  }
});

app.components.UserList = React.createBackboneClass({
  getInitialState: function() {
    return {
      searchString: ""
    }
  },

  matchesSearch: function(value) {
    return value.get("nick").indexOf(this.state.searchString) !== -1;
  },

  updateSearch: function(ev) {
    this.setState({searchString: ev.target.value});
  },

  render: function() {
    return (
      <div className="userList">
        <div className="userSearch">
          <input placeholder="Search users" defaultValue={this.state.searchString} onChange={this.updateSearch} />
        </div>
        <div className="usersListed">
          <div>
            <small><strong>Operators</strong></small>
          </div>
          {this.getCollection().sortAll("@").filter(this.matchesSearch).map(function(user) {
            return <app.components.User model={user} />
          })}
          <small><strong>Users</strong></small>
          {this.getCollection().sortAll("").filter(this.matchesSearch).map(function(user) {
            return <app.components.User model={user} />
          })}
        </div>
      </div>
    );
  }
});
