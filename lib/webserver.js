var express = require('express'), path = require('path');
var app = exports.app = express.createServer();
var config = require('../config')[app.settings.env];

app.configure(function() {
  var basePath = path.join(__dirname, '..');

  app.use(require('connect-assets')({ build: false, src: basePath + '/assets' }));
  app.use('/assets', express.static(basePath + '/assets'));
  app.use('/img', express.static(basePath + '/assets/images'));
  app.set('views', basePath + '/views');

  app.set('port', config.port);
  app.set('client_port', config.client_port);
  app.set('mongoose_endpoint', config.mongoose_endpoint);
  app.set('accept_self_signed_ssl', config.accept_self_signed_ssl);
  app.set('accept_expired_ssl', config.accept_expired_ssl);
});

app.listen(config.port);

app.get('/', function(req, res) {
  res.render('index.jade', { port: config.client_port, env: app.settings.env });
});
