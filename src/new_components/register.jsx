app.components.Register = React.createBackboneClass({
  render: function() {
    return (
      <div>
        <h3>Register</h3>
        <form>
          <div className="row">
            <div className="form-group col-sm-6">
              <input className="fullWidth form-control" placeholder="username" ref="username" onKeyPress={this.checkKey} required />
            </div>
          </div>

          <div className="row">
            <div className="form-group col-sm-6">
              <input className="fullWidth form-control" placeholder="password" ref="password" type="password" onKeyPress={this.checkKey} required />
            </div>
          </div>
          <a className="btn pointer" onClick={this.register}>Register</a>
        </form>
      </div>
    )
  }
});
