// Get our command line arguments
const argv = require("yargs").argv;

const debug = function(app, nsp, connections) {
  if (typeof argv.debug !== "undefined") {
    app.get('/debug', function(req,res) {
      res.render("debug.ejs");
    });

    nsp.on('connection', function(socket) {
      console.log('Debug connected');
    });
  }

  // From stackoverflow for printing objects with circular references
  const censor = function(censor) {
    let i = 0;

    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) === 'object' && censor == value) {
        return '[Circular]';
      }

      if(i >= 29) { // seems to be a hardcoded maximum of 30 serialized objects?
        return '[Unknown]';
      }

      ++i; // so we know we aren't using the original object anymore

      return value;
    };
  }


  process.on('uncaughtException', function(err) {
    console.log("Connections: %j", censor(connections));
  });
};

module.exports = debug;
