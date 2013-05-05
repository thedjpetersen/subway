module.exports = function(app) {
  // pull in the connection db model
  var Connection = app.db.models.connection;

  // is restoration enabled?
  if (app.config.restore_connections) {
    // restore connections
    Connection.find({keep_alive: 1}, function (err, conns) {
      if (!err) {
        for (var i=0; i<conns.length; i++) {
          app.ircbridge.emit('restore_irclink', conns[i].id);
        }
      }
    });
  }
};