app.components.User = React.createBackboneClass({
  render: function() {
    return (
      <div className="user">
        <span className={this.getModel().isActive()}>{this.getModel().get("type")}{this.getModel().get("nick")}</span>
        <span className="lastActive">{this.getModel().getActive()}</span>
      </div>
    )
  }
});

app.components.UserList = React.createBackboneClass({
  render: function() {
    return (
      <div className="userList">
        <div className="usersListed">
          <small><strong>Operators</strong></small>
          {this.getCollection().sortAll("@").map(function(user) {
            return <app.components.User model={user} />
          })}
          <small><strong>Users</strong></small>
          {this.getCollection().sortAll("").map(function(user) {
            return <app.components.User model={user} />
          })}
        </div>
      </div>
    );
  }
});
