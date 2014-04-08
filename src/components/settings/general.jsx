/** @jsx React.DOM */

app.components.general = function() {
  var General = React.createClass({
    updateSetting: function(ev) {
      var setting = ev.target.getAttribute("data-setting");
      app.settings[setting] = ev.target.value;

      if (typeof app.user !== "undefined") {
        app.io.emit("saveSettings", app.settings);
      }

      this.forceUpdate();
    },

    toggleMessageType: function(ev) {
      var type = $(ev.target).attr("data-type");
      var enabled_types = this.props.settings.enabled_types;
      var disabled_types = this.props.settings.disabled_types;

      if(_.contains(enabled_types, type)) {
        this.props.settings.enabled_types = _.without(enabled_types, type);
        this.props.settings.disabled_types.push(type);
      } else {
        this.props.settings.disabled_types = _.without(disabled_types, type);
        this.props.settings.enabled_types.push(type);
      }

      this.forceUpdate();
    },

    render: function() {
      var _this = this;
      return (
        <div>
          <label>Time Format</label>
          <div>
            <input data-setting="time_format" defaultValue={this.props.settings.time_format} onChange={this.updateSetting} />
            <a target="_blank" href="http://momentjs.com/docs/#/displaying/format/"><i className="fa fa-question-circle"></i></a>
            <div>
              <span>e.g. {moment().format(this.props.settings.time_format)}</span>
            </div>
          </div>
          <hr />
          <label>Message Types</label>
          <ul className="messageTypes">
          {_.union(this.props.settings.enabled_types, this.props.settings.disabled_types).sort().map(function(type) {
            var is_active = _.contains(_this.props.settings.enabled_types, type);
            var active = is_active ? "active pointer" : "pointer";
            if (is_active) {
              return (
                <li className={active} onClick={_this.toggleMessageType} data-type={type}>{type}<i className="fa fa-check right"></i></li>
              );
            } else {
              return (
                <li className={active} onClick={_this.toggleMessageType} data-type={type}>{type}</li>
              );
            }
          })}
          </ul>
        </div>
      )
    }
  });

  return General;
}
