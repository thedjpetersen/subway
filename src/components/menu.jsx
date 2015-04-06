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

  var ListConnections = React.createBackboneClass({
    disconnect: function(ev) {
      var conn = $(ev.target).attr("data-connection");
      app.io.emit("remove_connection", {
        connection: conn
      });
    },

    render: function() {
      var _this = this;

      return (
        <div className="activeConnections">
          {function(cxt) {
            if(cxt.getModel().length) {
              return <h3>Active Connections</h3>;
            }
          }(this)}
          {this.getModel().map(function(conn) {
            return (
              <div>
                <i className="fa fa-minus-circle pointer" onClick={_this.disconnect} data-connection={conn.get("name")}></i>
                <strong>{conn.get("name")}</strong>
                <span>{conn.get("nick")}</span>
              </div>
            );
          })}
        </div>
      )
    }
  });

  var Connect = React.createBackboneClass({
    checkKey: function(ev) {
      if(ev.charCode === 13) {
        this.connect();
      }
    },

    connect: function() {
      if(!_.validateForm(this.refs)) {
        return;
      }

      var _this = this;
      var form_data = _.parseForm(this.refs);
      $(this.getDOMNode()).find("input").prop("disabled", true);
      app.io.emit("connectirc", form_data);

      app.io.on("connection_error", function(data) {
        _this.props.errorMessage = "Error connecting";
        _this.forceUpdate();
        _this.props.errorMessage = undefined;
      });
    },

    toggleOptions: function() {
      $(this.getDOMNode).find(".moreOptions").toggleClass("hide");
    },

    componentDidUpdate: function() {
      $(this.getDOMNode()).find("input").prop("disabled", false).val("");
    },

    componentWillUnmount: function() {
      app.io.removeAllListeners("connection_error");
    },

    render: function() {
      return (
        <div>
          <h1>Connect</h1>
          {function(cxt) {
            if(cxt.props.errorMessage) {
              return (
                <div className="alert error">
                  <p>
                    <i className="fa fa-exclamation-circle spacing-right"></i>
                    {cxt.props.errorMessage}
                  </p>
                </div>
              )
            }
          }(this)}
          <form>
            <div>
              <input className="fullWidth" placeholder="Server" ref="server" onKeyPress={this.checkKey} required />
            </div>
            <div>
              <input className="fullWidth" placeholder="Nick" ref="nick" onKeyPress={this.checkKey} required />
            </div>
            <p>
              <a className="pointer" onClick={this.toggleOptions}>More Options</a>
            </p>
            <div className="moreOptions hide">
              <hr />
              <div>
                <input className="fullWidth" placeholder="Username" ref="userName" onKeyPress={this.checkKey} />
              </div>

              <div>
                <input className="fullWidth" placeholder="Password" ref="password" type="password" onKeyPress={this.checkKey} />
              </div>

              <div>
                <input className="fullWidth" placeholder="Real Name" ref="realName" onKeyPress={this.checkKey} />
              </div>

              <div>
                <input className="fullWidth" placeholder="Port" ref="port" onKeyPress={this.checkKey} />
              </div>

              <div>
                <input type="checkbox" ref="sasl" />
                <label>SASL</label>
              </div>
              
              <div>
                <input type="checkbox" ref="secure" />
                <label>SSL</label>
              </div>
            </div>
            <a className="button pointer" onClick={this.connect}>Connect</a>
          </form>
          <ListConnections model={this.getModel()}/>
        </div>
      )
    }
  });

  var User = React.createBackboneClass({
    logout: function() {
      var _this = this;
      $.post('/logout/', function(data) {
        if(data.success) {
          delete app.user;
          app.irc.get("connections").reset();
          _this.props.login();
        }
      });
    },

    render: function() {
      return (
        <div>
          <h1>User Details</h1>
          <p>{this.getModel().get("username")}</p>
          <a className="button pointer" onClick={this.logout}>Logout</a>
        </div>
      )
    }
  });

  var Login = React.createClass({
    checkKey: function(ev) {
      if(ev.charCode === 13) {
        this.login();
      }
    },

    redirectConnection: function() {
    },

    login: function() {
      var _this = this;
      var form_data = _.parseForm(this.refs);

      form_data.socketid = app.io.io.engine.id;

      $.post("login/", form_data, function(data) {

        // Notify server of login
        app.io.emit("logged_in", {username: data.username});

        if(data.status === "success") {
          app.user = new app.models.SubwayUser({
            username: data.username
          });

          _this.props.connect();

          if (data.has_connection) {
            $(".mainMenu").toggleClass("hide")
          }
        }
        else if (data.status === "error") {
          _this.props.errorMessage = data.error;
          _this.forceUpdate();
          _this.props.errorMessage = undefined;
        }
      });
    },

    render: function() {
      return (
        <div>
          <h1>Login</h1>
          {function(cxt) {
            if(cxt.props.errorMessage) {
              return (
                <div className="alert error">
                  <p>
                    <i className="fa fa-exclamation-circle spacing-right"></i>
                    {cxt.props.errorMessage}
                  </p>
                </div>
              )
            }
          }(this)}
          <form>
            <div>
              <input className="fullWidth" placeholder="username" ref="username" onKeyPress={this.checkKey} />
            </div>
            <div>
              <input className="fullWidth" placeholder="password" ref="password" type="password" onKeyPress={this.checkKey} />
            </div>
            <a className="button pointer" onClick={this.login}>Login</a>
          </form>
        </div>
      )
    }
  })

  var Register = React.createClass({
    register: function() {
      var form_data = _.parseForm(this.refs);
      $.post('/register/', form_data, function(data) {
        console.log(data);
      });
      //app.io.emit("register", form_data);
    },

    render: function() {
      return (
        <div>
          <h1>Register</h1>
          <form>
            <div>
              <input className="fullWidth" placeholder="username" ref="username" />
            </div>
            <div>
              <input className="fullWidth" placeholder="password" ref="password" type="password" />
            </div>
            <a className="button pointer" onClick={this.register}>Register</a>
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
      this.setState({activeItem: "login"});
    },

    register: function(event) {
      this.setState({activeItem: "register"});
    },

    user: function(event) {
      this.setState({activeItem: "user"});
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
            {function(cxt) {
              if(app.user) {
                return (
                  <li className={cxt.state.activeItem === 'user' ? 'activeMenuItem' : '' } onClick={cxt.user}>
                    <span className="menuIcon"><i className="fa fa-user"></i></span>
                    {app.user.get("username")}
                  </li>
                )
              } else {
                return (
                  <div>
                    <li className={cxt.state.activeItem === 'login' ? 'activeMenuItem' : '' } onClick={cxt.login}>
                      <span className="menuIcon"><i className="fa fa-lock"></i></span>
                      Login
                    </li>
                    <li className={cxt.state.activeItem === 'register' ? 'activeMenuItem' : '' } onClick={cxt.register}>
                      <span className="menuIcon"><i className="fa fa-users"></i></span>
                      Register
                    </li>
                  </div>
                )
              }
            }(this)}
            <li className={this.state.activeItem === 'settings' ? 'activeMenuItem' : '' } onClick={this.settings}>
              <span className="menuIcon"><i className="fa fa-gear"></i></span>
              Settings
            </li>
          </ul>
          <div className="menuArea">
            { function(cxt) {switch(cxt.state.activeItem) {
              case "connect":
                return <Connect model={app.irc.get("connections")} />
              case "settings":
                return <Settings />
              case "user":
                return <User model={app.user} login={cxt.login} />
              case "login":
                return <Login connect={cxt.connect} />
              case "register":
                return <Register />
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
    this.menu = React.renderComponent(new Menu(), $(".mainMenu").get(0));
  }

  this.render = function() {
    this.menu.forceUpdate();
  }
}
