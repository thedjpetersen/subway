#!/usr/bin/env node

/* The Subway IRC client
 * Written By: David Petersen (thedjpetersen)
 *
 * This is a persistent web based IRC client that is targeted
 * to those new to IRC.
*/

// Basic dependencies. We use connect/http to server our content. 
// Bower manages our 3rd party dependcies allowing us to upgrade them
// easily(just update the bower.json file). The async module manages our flow -
// instead of nesting callbacks we try to follow the waterfall pattern
// to have at least the appearance of synchronous code. This aids our readabilty.
var express = require("express"),
       http = require("http"),
      bower = require("bower"),
      async = require("async");

var server_settings = require("./settings/server");

// These are our local lib files. The initialize function in our plugin module
// fetches the different plugins(github gists) we have and downloads them to 
// the plugin_cache directory.
//
// The static module includes all of our grunt configuration. 
// This takes care of any code preprocessing(grunt/stylus/Jade)
// as well code concatenation/minfication.
//
// The connection module handles any interaction between the client and the server
// all incoming IRC commands are hanndled here. It was also handle IRC logging
// and any other info that needs to be sent to the client(plugin info or settings)
var init_plugins = require("./lib/plugins").initialize,
          static = require("./lib/static"),
      connection = require("./lib/connection");

var cwd = __dirname;

// We use the async module waterfall to set through different steps to start up
// the subway client. Each one needs to happen in series
async.waterfall([
  function(callback) {
    // This method fetches different plugins from the github gists
    // and saves them to the plugin_cache directory
    console.log("Fetching Subway plugins...");
    // TODO
    // resolve Fatal error: getaddrinfo ENOTFOUND
    // when we don't have active internet connection
    init_plugins(callback);
  },
  function(callback) {
    // We download all of our third party dependencies or upgrade any if
    // if the configuration has changed. These are all client side depdencies
    // like jQuery, Backbone or React.
    console.log("Downloading dependencies...");
    bower.commands.install().on("end", function(results){
      callback(null, results);
    });
  },
  function(results, callback) {
    // We compile any preprocessed code that we need to like React components
    // and Stylus stylesheets
    console.log("Compiling static resources...");
    static(function() {
      callback(null);
    });
  }
], function(err, result) {
  // All static content is placed in the tmp ./tmp directory
  // we use this directory as the root of our server
  var app = express()
            .use(express.urlencoded())
            .use(express.cookieParser(server_settings.cookie_secret || "subway_secret"))
            .use(express.static(cwd + "/tmp"));

  app.configure(function() {
    app.set("views", __dirname + "/tmp");
  });
  app.engine("ejs", require("ejs").renderFile);


  var http = require("http").Server(app);
  //var server = http.createServer(app).listen(process.env.PORT || 3000);
  var io = require("socket.io")(http);

  http.listen(process.env.PORT || 3000);

  // We pass off our socket.io listener to the connection module
  // so it can handle incoming events and emit different actions
  connection(io, app);
});
