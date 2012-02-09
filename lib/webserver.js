var express = require('express');

var app = exports.app = express.createServer();

app.configure(function() {
  app.use(require('connect-assets')());
  app.use('/img', express.static(__dirname + '/../assets/images'));
  app.use('/assets', express.static(__dirname + '/../assets'));
  console.log(__dirname);
});

app.configure('development', function() {
  app.listen(3000);
});

app.configure('production', function() {
  // Nodester port
  app.listen(14383);
});

app.get('/', function(req, res) {
  res.render('index.jade', { layout: true });
});
