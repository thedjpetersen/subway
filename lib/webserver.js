var express = require('express'),
    path = require('path');

var app = exports.app = express.createServer();

app.configure(function() {
  var basePath = path.join(__dirname, '..');
  app.use(require('connect-assets')({src: basePath + '/assets'}));
  app.use('/assets', express.static(basePath + '/assets'));
  app.use('/img', express.static(basePath + '/assets/images'));
  app.set('views', basePath + '/views');
});

app.configure('development', function() {
  app.listen(3000);
});

app.configure('production', function() {
  // Nodester port
  app.listen(14400);
});

app.get('/', function(req, res) {
  res.render('index.jade', { layout: true });
});
