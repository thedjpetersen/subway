/** @jsx React.DOM */

app.components.user_list = function() {
  var User = React.createBackboneClass({
    render: function() {
      return (
        <div className="user">
          <span className={this.getModel().isActive()}>
            <i className="fa fa-circle"></i>
          </span>
          <span>{this.getModel().get("type")}{this.getModel().get("nick")}</span>
          <span className="lastActive">{this.getModel().getActive()}</span>
        </div>
      )
    }
  });

  var UserList = React.createBackboneClass({
    render: function() {
      return (
        <div className="userList">
          <div className="titlebar">
            <strong>User List</strong>
          </div>
          <div className="usersListed">
            {this.getModel().sortAll().map(function(user) {
              return <User model={user} />
            })}
          </div>
        </div>
      );
    }
  });

  return UserList;
};
