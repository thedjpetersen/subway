// Get our command line arguments
var argv = require("yargs").argv;

var debug = function(app, nsp) {
  if (typeof argv.debug !== "undefined") {
    app.get('/debug', function(req,res) {
      res.render("debug.ejs");
    });

    nsp.on('connection', function(socket) {
      console.log('Debug connected');
    });
  }

};

module.exports = debug;
