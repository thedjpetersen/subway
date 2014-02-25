/** @jsx React.DOM */

app.components.startMenu = function() {
  var Connect = React.createClass({
    connect: function() {
      var form_data = _.parseForm(this.refs);
      app.io.emit("connect", form_data);
    },

    render: function() {
      return (
        <div>
          <a className="pointer" onClick={this.props.back}>Back</a>
          <form>
            <div>
              <input placeholder="Server" ref="server" />
            </div>
            <div>
              <input placeholder="Nick" ref="nick" />
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
      React.renderComponent(<Connect back={this.back} />, $('.mainMenu').get(0))
    },

    login: function(event) {
    },

    register: function(event) {
    },

    settings: function(event) {
    },

    back: function(event) {
      React.renderComponent(this, $('.mainMenu').get(0))
    },

    render: function() {
      return (
        <ul className="menuList">
          <li className="faux_a" onClick={this.connect}>
            <span className="menuIcon"><i className="fa fa-bolt"></i></span>
            Connect
          </li>
          <li className="faux_a" onClick={this.login}>
            <span className="menuIcon"><i className="fa fa-lock"></i></span>
            Login
          </li>
          <li className="faux_a" onClick={this.register}>
            <span className="menuIcon"><i className="fa fa-users"></i></span>
            Register
          </li>
          <li className="faux_a" onClick={this.settings}>
            <span className="menuIcon"><i className="fa fa-gear"></i></span>
            Settings
          </li>
        </ul>
      );
    }
  })

  this.hide = function() {
    $(".mainMenu").addClass("hide");
  }

  this.show = function() {
    return React.renderComponent(new Menu(), $(".mainMenu").get(0));
  }
}
