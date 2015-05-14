app.components.Connect = React.createBackboneClass({
  toggleOptions: function() {
    $(this.getDOMNode).find(".moreOptions").toggleClass("hide");
  },

  connect: function(ev) {
    // If we are triggering a form submit
    // we want to prevent that since we 
    // connect no through a post but through
    // triggering a socket.io event
    if (ev) {
      ev.preventDefault();
    }

    var form_data = _.parseForm(this.refs);

    app.io.emit("ircconnect", form_data);
  },

  render: function() {
    return (
      <div>
        <h1 className="no-mobile">Connect</h1>
        <form>
          <div className="row">
            <div className="form-group col-sm-6">
              <input className="fullWidth form-control" placeholder="Server" ref="server" required />
            </div>
          </div>

          <div className="row">
            <div className="form-group col-sm-6">
              <input className="fullWidth form-control" placeholder="Nick" ref="nick" required />
            </div>
          </div>

          <p>
            <a className="pointer" onClick={this.toggleOptions}>More Options</a>
          </p>
          <div className="moreOptions hide">
            <div className="row">
              <div className="form-group col-sm-6">
                <input className="fullWidth form-control" placeholder="Username" ref="userName" />
              </div>
            </div>

            <div className="row">
              <div className="form-group col-sm-6">
                <input className="fullWidth form-control" placeholder="Password" ref="password" type="password" />
              </div>
            </div>

            <div className="row">
              <div className="form-group col-sm-6">
                <input className="fullWidth form-control" placeholder="Real Name" ref="realName" />
              </div>
            </div>

            <div className="row">
              <div className="form-group col-sm-6">
                <input className="fullWidth form-control" placeholder="Port" ref="port" />
              </div>
            </div>

            <div className="row">
              <div className="form-group col-sm-6">
                <label>
                  <input type="checkbox" ref="sasl" /> SASL
                </label>
              </div>
            </div>

            <div className="row">
              <div className="form-group col-sm-6">
                <label>
                  <input type="checkbox" ref="secure" /> SSL
                </label>
              </div>
            </div>

          </div>
          <button className="btn" onClick={this.connect}>Connect</button>
        </form>

      </div>
    )
  }
});
