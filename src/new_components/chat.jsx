app.components.TitleBar = React.createBackboneClass({
  toggleSideNav: function() {
    $("nav").toggleClass("open").toggleClass("closed");
  },

  render: function() {
    return (
      <div className="titlebar">
        <div className="mobile-nav">
          <div className="mobile-header">
            <a className="toggleSideNav" onClick={this.toggleSideNav}>
              <span className="fa fa-bars"></span>
            </a>
          </div>
        </div>

        <strong>{this.getModel().get("name")}</strong>
        <span className="topic">  {this.getModel().get("topic")}</span>
      </div>
    );
  }
});

app.components.Chat = React.createBackboneClass({
  render: function() {
    var _this = this;
    return (
      <div className="chat">
        <app.components.TitleBar model={this.getModel()} />
        <div className="messages-container">
          <app.components.Messages collection={this.getModel().get("messages")} fetchHistory={this.fetchHistory} />
          {function() {
          if(_this.getModel().get("name") !== "status") {
            return <app.components.UserList collection={_this.getModel().get("users")} />
          }
          }()}
        </div>
        <app.components.MessageInput />
      </div>
    )
  }
});
