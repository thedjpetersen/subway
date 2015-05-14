app.components.Menu = React.createBackboneClass({
  getDefaultProps: function() {
    return {
      active: "connect"
    };
  },

  toggleSideNav: function() {
    $("nav").toggleClass("open").toggleClass("closed");
  },

  setActive: function(target) {
    this.setProps({active: target});
  },

  selectActive: function(ev) {
    this.setProps({active: ev.target.value});
  },

  render: function() {
    var active = this.props.active;
    return (
      <div className="menu-container settings-view">
        <div className="mobile-nav">
          <div className="mobile-header">
            <a className="toggleSideNav" onClick={this.toggleSideNav}>
              <span className="fa fa-bars"></span>
            </a>
          </div>
          <select onChange={this.selectActive} className="form-control" value={this.props.active}>
            <option value="connect">Connect</option>
            <option value="login">Login</option>
            <option value="settings">Settings</option>
          </select>
        </div>
        <div className="config-menu">
          <ul className="panels-menu nav nav-pills nav-stacked">
            <li className={active === "connect" ? "active": ""}>
              <a onClick={this.setActive.bind(this, "connect")}>Connect</a>
            </li>
            <li className={active === "login" ? "active": ""}>
              <a onClick={this.setActive.bind(this, "login")}>Login</a>
            </li>
            <li className={active === "settings" ? "active": ""}>
              <a onClick={this.setActive.bind(this, "settings")}>Settings</a>
            </li>
          </ul>
        </div>
        <div className="menu-content">
        {function(active) {
          if (active === "connect") {
            return <app.components.Connect />
          } else if (active === "login") {
            return <app.components.Login />
          } else if (active === "settings") {
            return <app.components.Settings />
          } else {
            return "";
          }
        }(active)}
        </div>
      </div>
    )
  }
});
