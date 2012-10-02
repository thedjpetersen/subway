var mongoose = require('mongoose'),
  IRCLink = require('./irclink');

// establish models
var Connection = mongoose.model('Connection');

module.exports = function (connections) {
  // restore connections
  Connection.find({},function(err, docs){
    docs.forEach(function(doc){
      var connection = new IRCLink(doc.hostname, doc.port, doc.ssl, doc.selfSigned, doc.nick, doc.realName, doc.password, doc.rejoin, doc.away, doc.encoding, doc.keepAlive, doc.channels);
      connection.associateUser(doc.user);
      connections[doc.user] = connection;
      // set ourselves as away
      connection.setAway();
    });
  });
}
