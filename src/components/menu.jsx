/** @jsx React.DOM */

app.components.startMenu = function() {
  var General = app.components.general();
  var Plugins = app.components.plugins();
  var Highlights = app.components.highlight();

  var Settings = React.createClass({
    general: function() {
      this.setState({activeItem: "general"});
    },

    plugins: function() {
      this.setState({activeItem: "plugins"});
    },

    highlights: function() {
      this.setState({activeItem: "highlights"});
    },

    getInitialState: function() {
      return {activeItem: "general"};
    },

    render: function() {
      return (
        <div>
          <div>
            <ul className="navBar">
              <li className={this.state.activeItem === "general" ? "navActive": ""} onClick={this.general}>General</li>
              <li className={this.state.activeItem === "plugins" ? "navActive": ""} onClick={this.plugins}>Plugins</li>
              <li className={this.state.activeItem === "highlights" ? "navActive": ""} onClick={this.highlights}>Highlights</li>
            </ul>
          </div>
          {function(cxt) {
            switch(cxt.state.activeItem) {
              case "general":
                return <General settings={app.settings} />
              case "plugins":
                return <Plugins settings={app.settings} />
              case "highlights":
                return <Highlights settings={app.settings} />
            }
          }(this)}
        </div>
      )
    }
  });

  var Connect = React.createClass({
    connect: function() {
      var form_data = _.parseForm(this.refs);
      app.io.emit("connect", form_data);
    },

    render: function() {
      return (
        <div>
          <h1>Connect</h1>
          <form>
            <div>
              <input className="fullWidth" placeholder="Server" ref="server" />
            </div>
            <div>
              <input className="fullWidth" placeholder="Nick" ref="nick" />
            </div>
            <a className="button pointer" onClick={this.connect}>Login</a>
          </form>
        </div>
      )
    }
  })

  // We declare this in the global scope so it can be rendered from the top
  var Menu = React.createClass({
    connect: function(event) {
      this.setState({activeItem: "connect"});
    },

    login: function(event) {
    },

    register: function(event) {
    },

    settings: function(event) {
      this.setState({activeItem: "settings"});
    },

    getInitialState: function() {
      return { activeItem: "connect" };
    },

    render: function() {
      return (
        <div className="menuContainer">
          <ul className="menuList">
            <li className={this.state.activeItem === 'connect' ? 'activeMenuItem' : '' } onClick={this.connect}>
              <span className="menuIcon"><i className="fa fa-bolt"></i></span>
              Connect
            </li>
            <li className={this.state.activeItem === 'login' ? 'activeMenuItem' : '' } onClick={this.login}>
              <span className="menuIcon"><i className="fa fa-lock"></i></span>
              Login
            </li>
            <li className={this.state.activeItem === 'register' ? 'activeMenuItem' : '' } onClick={this.register}>
              <span className="menuIcon"><i className="fa fa-users"></i></span>
              Register
            </li>
            <li className={this.state.activeItem === 'settings' ? 'activeMenuItem' : '' } onClick={this.settings}>
              <span className="menuIcon"><i className="fa fa-gear"></i></span>
              Settings
            </li>
          </ul>
          <div className="menuArea">
            { function(cxt) {switch(cxt.state.activeItem) {
              case "connect":
                return <Connect />
              case "settings":
                return <Settings />
            }}(this)}
          </div>
        </div>
      );
    }
  })

  this.hide = function() {
    $(".mainMenu").addClass("hide");
  }

  this.show = function() {
    React.renderComponent(new Menu(), $(".mainMenu").get(0));

    $("nav img").click(function() {
      $(".mainMenu").toggleClass("hide");
    });
  }
}
