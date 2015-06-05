app.components.Settings = React.createBackboneClass({
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
                return <app.components.General settings={app.settings} />
              case "plugins":
                return <app.components.Plugins settings={app.settings} />
              case "highlights":
                return <app.components.Highlights settings={app.settings} />
            }
          }(this)}
        </div>
      )
    }
});
