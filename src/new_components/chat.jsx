app.components.TitleBar = React.createBackboneClass({
  render: function() {
    return (
      <div className="titlebar">
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
