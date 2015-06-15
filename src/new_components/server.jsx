app.components.channelList = React.createBackboneClass({
  getInitialState: function() {
    return {
      page: 1,
      per_page: 20,
      sortAttr: "channel",
      sortDir: 1,
      filter: ""
    };
  },

  nextPage: function() {
    this.setState({page: this.state.page+1});
  },

  previousPage: function() {
    this.setState({page: this.state.page-1});
  },

  setPage: function(page) {
    this.setState({page: page});
  },

  sortName: function() {
    this.changeDir();
    this.setState({sortAttr: "channel"});
  },

  sortTopic: function() {
    this.changeDir();
    this.setState({sortAttr: "topic"});
  },

  sortUsers: function() {
    this.changeDir();
    this.setState({sortAttr: "users"});
  },

  changeDir: function() {
    this.setState({sortDir: this.state.sortDir*-1, page:1});
  },

  refresh: function(ev) {
    this.refreshButton = _.makeWorkingButton(ev.target);
    app.io.emit("command", {server: this.props.serverName, target: "", command: "list"});
  },

  joinChannel: function(channel) {
    app.io.emit("command", {server: this.props.serverName, target: "", command: "join " + channel});
    app.irc.set("serverView", undefined);
  },

  filter: function(ev) {
    this.setState({filter: ev.target.value});
  },

  componentDidUpdate: function() {
    if(this.refreshButton) {
      this.refreshButton.restore();
    }
  },

  render: function() {
    var _this = this;
    return (
      <div className="serverList">
        <input className="spacing-right" onChange={this.filter} placeholder="Search" />
        <a className="btn" onClick={this.refresh}>Refresh</a>
        <table className="table">
          <thead>
            <th onClick={this.sortName} className="pointer">Name</th>
            <th onClick={this.sortTopic} className="pointer">Topic</th>
            <th onClick={this.sortUsers} className="pointer">Users</th>
          </thead>
          <tbody>
            {this.props.channels.getPage(this.state).map(function(channel) {
              return (
                <tr>
                  <td><a onClick={_this.joinChannel.bind(null, channel.get("channel"))}>{channel.get("channel")}</a></td>
                  <td>{channel.get("topic")}</td>
                  <td>{channel.get("users")}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <ul className="pagination">
          <li>
            <a onClick={_this.previousPage}><span>&laquo;</span></a>
          </li>
          {_.range(1, (this.props.channels.length/this.state.per_page)).map(function(page) {
            return <li className={_this.state.page === page ? "active" : ""}><a onClick={_this.setPage.bind(null, page)}>{page}</a></li>
          })}
          <li>
            <a onClick={_this.nextPage}><span>&raquo;</span></a>
          </li>
        </ul>
      </div>
    )
  }
});

app.components.Server = React.createBackboneClass({
  render: function() {
    return (
      <div className="server">
        <h2>{this.getModel().get("name")}</h2>
        <dl>
        <dt>Nick</dt>
        <dd>{this.getModel().get("nick")}</dd>
        </dl>
        <h3>Channel List</h3>
        <app.components.channelList serverName={this.getModel().get("name")} channels={this.getModel().get("list") || []} />
      </div>
    )
  }
});
