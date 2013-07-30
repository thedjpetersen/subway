module.exports = function(app) {
  // pull in the connection db model
  var Connection = app.db.models.Connection;

  // is restoration enabled?
  if (app.config.restore_connections) {
    // restore connections
    Connection.all({where: { keep_alive: true }}, function(err, conns) {
      if (!err) {
        for (var i=0; i<conns.length; i++) {
          app.ircbridge.emit('restore_irclink', conns[i].id);
        }
      }
    });
  }
};