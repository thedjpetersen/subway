// Manages the plugin settings in the menu
// Component for invidual plugin
// its private property is a boolean value `settings`
// which determines whether or not to show the plugins settings
//
// From the parent plugins class it recieves the plugin
// and the mode of the parent either "active" or "registry"
// based on the mode we know what buttons to display
app.components.Plugin = React.createBackboneClass({
  getInitialState: function() {
    return {
      settings: false
    };
  },

  // Flips the settings switch and causes the plugin to 
  // re-render showing the plugins settings
  toggleSettings: function() {
    this.setState({
      settings: !this.state.settings
    });
    this.forceUpdate();
  },

  // This adds or removes the plugin from our list of plugins
  // if the plugin is not stored locally the script will also
  // fetch it from the server
  togglePlugin: function() {
    // Store some local variables for convenience
    var ap = app.settings.active_plugins;
    var plugin = this.props.plugin;

    // If we are just viewing the active plugins we want to remove
    // our plugin from the list
    //
    // otherwise we want to add it(fetching it from the server if necessary)
    if (this.props.mode === "active") {
      app.settings.active_plugins = _.without(ap, plugin.pluginId);
      this.props.toggleListener();
    } else {
      // If it is already installed we
      // just want to add it to our active plugins
      if(app.plugins[plugin.pluginId]) { 
        app.settings.active_plugins.push(plugin.pluginId);
        this.props.toggleListener();
      } else {
        // We signal the server to fetch the plugin if it is
        // not already downloaded into our plugin cache
        // after this is complete it will send us back an 
        // event that plugin has been fetched and cached
        // so we can add it to our client
        var _this = this;
        app.io.emit("add_plugin", {plugin: plugin.gist});

        app.io.once("plugin_added", function(data) {
          util.loadPlugin(data.plugin, function() {
            _this.props.toggleListener();
          });
        });
      }
    }
  },

  // If the user changes the settings(by typing or otherwise)
  // we want to update the settings for that plugin. If the user
  // has entered invalid JSON we just ignore it
  //
  // TODO: add some sort of error class to the textarea to let 
  // the user know they have entered some form of invalid JSON
  updateSettings: function(ev) {
    try {
      this.props.plugin.settings = JSON.parse(ev.target.value);
      app.io.emit("saveSettings", app.settings);
    } catch(e) {
      return;
    }
  },

  // Utility method that checks if we are on active screen
  // and if this plugin is actively being used
  // used to decide whether to render all plugin buttons
  // and the 'active' badge
  isActive: function() {
    return this.props.mode !== "active" && _.contains(app.settings.active_plugins, this.props.plugin.pluginId);
  },

  render: function() {
    return (
      <div className="menuPlugin">
        <div className="pluginButtons">
          {this.props.mode === "active" ? <a className="btn pointer spacing-right" onClick={this.toggleSettings}>Settings</a> : ""}
          {!this.isActive() ? <a className="btn pointer" onClick={this.togglePlugin}>{this.props.mode === "registry" ? "Add" : "Remove"}</a> : ""}
        </div>

        <strong className="spacing-right">{this.props.plugin.pluginId}</strong>
        <small className="spacing-right">by: {this.props.plugin.author}</small>
        {this.isActive() ? <span className="badge">Active</span> : "" }
        <p>{this.props.plugin.description}</p>
        {this.state.settings ? <textarea onChange={this.updateSettings}>{JSON.stringify(this.props.plugin.settings, null, 2)}</textarea> : "" }
      </div>
    )
  }
});

app.components.Plugins = React.createBackboneClass({
  getInitialState: function() {
    return ({
      mode: "active",
      searchString: ""
    });
  },

  active: function() {
    this.setState({
      mode: "active",
      searchString: ""
    });
  },

  registry: function() {
    this.setState({
      mode: "registry",
      searchString: ""
    });
  },

  pluginToggled: function() {
    this.forceUpdate();
  },

  search: function(ev) {
    this.setState({
      searchString: ev.target.value
    });
  },

  // Convenience method to return list of methods
  // filtered by search string if necessary
  getPlugins: function() {
    var plugins;

    // We split our search terms into an array
    var search_terms = this.state.searchString.split(" ");

    if (this.state.mode === "active") {
      plugins = _.map(this.props.settings.active_plugins.sort(), function(pluginId) {
        var plugin = app.plugin_data[pluginId];
        return plugin;
      });

    } else {
      plugins = _.map(_.keys(app.plugin_registry).sort(), function(key) {
        var plugin = app.plugin_registry[key];
        plugin.pluginId = key;
        return plugin;
      });
    }

    // Filter base on search terms
    return _.filter(plugins, function(plugin) { 
      var matched = true;
      // We see if any of the search terms match the id or description of
      // the plugin 
      _.each(search_terms, function(st) {
        st = new RegExp(st, "ig");
        var name = plugin.name || plugin.pluginId;

        if(name.match(st) === null &&
           plugin.description.match(st) === null &&
             plugin.author.match(st) === null) {
          matched = false;
        }
      });

      return matched;
    });
  },

  render: function() {
    return (
      <div>
        {function(cxt) {
          if(cxt.state.mode === "active") {
            return (
              <div>
                <div>
                  <a className="btn pointer spacing-right" onClick={cxt.registry}>Registry</a>
                  <input placeholder="search" onChange={cxt.search} defaultValue={cxt.searchString} />
                </div>
                <div className="menuPlugins">
                  {cxt.getPlugins().map(function(plugin) {
                    return (
                      <app.components.Plugin plugin={plugin} mode={cxt.state.mode} toggleListener={cxt.pluginToggled} />
                    )
                  })}
                  {cxt.props.settings.active_plugins.length === 0 ? <p>No active plugins</p> : "" }
                </div>
              </div>
            )
          } else {
            return (
              <div>
                <div>
                  <a className="btn pointer spacing-right" onClick={cxt.active}>Active Plugins</a>
                  <input placeholder="search" onChange={cxt.search} defaultValue={cxt.searchString}/>
                </div>
                <div className="menuPlugins">
                  {cxt.getPlugins().map(function(plugin) {
                    return (
                      <app.components.Plugin plugin={plugin} mode={cxt.state.mode} toggleListener={cxt.pluginToggled} />
                    )
                  })}
                </div>
              </div>
            )
          }
        }(this)}
      </div>
    )
  }
});
