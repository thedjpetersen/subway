var IRCLink = require('./irclink');

module.exports = function(app) {
  app.ircbridge.on('create_irclink', function(connID) {
    // Only creates an IRC connection if not already connected
    if (app.ircConnectionArray.indexOf(connID) === -1) {
      var newConn = new IRCLink(connID, app);
    }
  });
};