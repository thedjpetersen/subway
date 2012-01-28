var express = require('express');

var app = exports.app = express.createServer();

app.configure(function() {
  // executed for each env
  app.use(require('connect-assets')());
  app.use("/assets", express.static(__dirname + '/../assets'));
  console.log(__dirname);
});

app.configure('development', function() {
  // executed for 'development' only
});

app.get('/', function(req, res) {
  res.render('index.jade', { layout: true });
});
