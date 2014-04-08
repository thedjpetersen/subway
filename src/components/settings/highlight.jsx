/** @jsx React.DOM */

app.components.highlight = function() {
  var Highlight = React.createClass({
    updateName: function(event) {
      this.props.highlight.name = event.target.value;
      this.forceUpdate();
    },

    updateRegex: function(event) {
      this.props.highlight.regex = event.target.value;
      this.forceUpdate();
    },

    updateColor: function(event) {
      this.props.highlight.color = event.target.value;
      $(this.getDOMNode()).find("input[name='color']").val(event.target.value);
      this.forceUpdate();
    },

    render: function() {
      return (
        <div className="menuHighlight">
          <div>
            <label>Name</label>
            <input name="regex" className="fullWidth" defaultValue={this.props.highlight.name} onChange={this.updateName} />
          </div>
          <div>
            <label>Regex</label>
            <input name="regex" className="fullWidth" defaultValue={this.props.highlight.regex} onChange={this.updateRegex} />
          </div>
          <div>
            <div>
              <label>Color</label>
            </div>
            <input name="color" defaultValue={this.props.highlight.color} onChange={this.updateColor} />
            {function(cxt) {
              if (Modernizr.inputtypes.color) {
                return <input name="color" defaultValue={cxt.props.highlight.color} type="color" onChange={cxt.updateColor} />
              }
            }(this)}
          </div>
        </div>
      )
    }
  });

  var Highlights = React.createClass({
    getInitialState: function() {
      return {editMode: "normal"};
    },

    editNormal: function() {
      this.setState({
        editMode: "normal"
      });
    },

    editJSON: function() {
      this.setState({
        editMode: "JSON"
      });
    },

    updateJSON: function(ev) {
      try {
        var new_highlights = JSON.parse(ev.target.value);
        app.settings.highlights = new_highlights;

        // Remove any existing errors
        $(this.getDOMNode()).find("textarea").removeClass("error")

        app.io.emit("saveSettings", app.settings);
      } catch (e) {
        // Add error
        $(this.getDOMNode()).find("textarea").addClass("error")
      }
    },

    addNew: function() {
      app.settings.highlights.push({
        name: "",
        regex: "",
        color: ""
      });
      app.io.emit("saveSettings", app.settings);
      this.forceUpdate();
    },

    render: function() {
      return (
        <div>
          <div>
            {function(cxt) {
              if(cxt.state.editMode === "JSON") {
                return <a className="button pointer spacing-right" onClick={cxt.editNormal}>Easy Editor</a>
              } else {
                return (
                  <span>
                    <a className="button pointer spacing-right" onClick={cxt.editJSON}>Edit JSON</a>
                    <a className="button pointer spacing-right" onClick={cxt.addNew}>Add new</a>
                  </span>
                )
              }
            }(this)}

            <a className="button blue pointer" onClick={util.highlightCss}>Save</a>
          </div>

          {function(cxt) {
              if(cxt.state.editMode === "JSON") {
                return <textarea className="highlightEditor fullWidth" onChange={cxt.updateJSON}>{JSON.stringify(cxt.props.settings.highlights, null, 2)}</textarea>
              } else {
                return cxt.props.settings.highlights.map(function(highlight) {
                  return (
                    <Highlight highlight={highlight} />
                  )
                })
              }
          }(this)}
        </div>
      )
    }
  });

  return Highlights;
}
