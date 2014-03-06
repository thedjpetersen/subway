/** @jsx React.DOM */

app.components.general = function() {
  var General = React.createClass({
    updateSetting: function(ev) {
      var setting = ev.target.getAttribute("data-setting");
      app.settings[setting] = ev.target.value;
      this.forceUpdate();
    },

    render: function() {
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
        </div>
      )
    }
  });

  return General;
}
