app.components.irc = React.createBackboneClass({
  render: function() {
    var _this = this;

    return (
      <div className="app">
        {function() {
          if(_this.getModel().get("serverView")) {
            return <app.components.Server model={_this.getModel().get("connections").get(_this.getModel().get("serverView"))} />
          } else {
            return <app.components.Chat model={_this.getModel().getActiveChannel()} />
          }
        }()}
      </div>
    );
  }
});
