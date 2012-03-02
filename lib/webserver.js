var express = require('express'),
    path = require('path');

var app = exports.app = express.createServer();
var port;

// process.on('uncaughtException', function(err) {
//     console.log(err.stack);
// });

app.configure(function() {
  var basePath = path.join(__dirname, '..');
  app.use(require('connect-assets')({build: false, src: basePath + '/assets'}));
  app.use('/assets', express.static(basePath + '/assets'));
  app.use('/img', express.static(basePath + '/assets/images'));
  app.set('views', basePath + '/views');
});

app.configure('development', function() {
  port = process.env.PORT || 3000;
});

app.configure('production', function() {
  // Nodester port
  port = process.env.PORT || 14858;
});

app.listen(port);

app.get('/', function(req, res) {
  res.render('index.jade', {port: port, env: process.env.NODE_ENV || null});
});
