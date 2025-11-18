#!/usr/bin/env node

/* The Subway IRC client
 * Written By: David Petersen (thedjpetersen)
 *
 * This is a persistent web based IRC client that is targeted
 * to those new to IRC.
*/

// Basic dependencies. We use Express/HTTP to serve our content.
// Modern async/await patterns are used for flow control instead of callbacks.
const express = require("express");
const http = require("http");
const bower = require("bower");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { promisify } = require("util");

const server_settings = require("./settings/server");

// Get current environment
const env = process.env.IRC_ENV || "dev";

// These are our local lib files. The initialize function in our plugin module
// fetches the different plugins(github gists) we have and downloads them to
// the plugin_cache directory.
//
// The static module includes all of our grunt configuration.
// This takes care of any code preprocessing(grunt/stylus/Jade)
// as well code concatenation/minification.
//
// The connection module handles any interaction between the client and the server
// all incoming IRC commands are handled here. It also handles IRC logging
// and any other info that needs to be sent to the client(plugin info or settings)
const init_plugins = require("./lib/plugins").initialize;
const static = require("./lib/static");
const connection = require("./lib/connection");

const cwd = __dirname;

// Promisify the init_plugins callback-based function
const init_plugins_async = promisify(init_plugins);

// Wrapper to promisify bower.commands.install()
const installBowerDependencies = () => {
  return new Promise((resolve, reject) => {
    console.log("Downloading dependencies...");
    bower.commands.install()
      .on("end", (results) => resolve(results))
      .on("error", (err) => reject(err));
  });
};

// Promisify the static build function
const buildStatic = promisify(static);

// Main startup function using async/await
async function startSubway() {
  try {
    // Step 1: Fetch different plugins from the github gists
    // and save them to the plugin_cache directory
    console.log("Fetching Subway plugins...");
    // TODO: resolve Fatal error: getaddrinfo ENOTFOUND
    // when we don't have active internet connection
    await init_plugins_async();

    // Step 2: Download all third party dependencies or upgrade any if
    // the configuration has changed. These are all client side dependencies
    // like jQuery, Backbone or React.
    await installBowerDependencies();

    // Step 3: Compile any preprocessed code that we need to like React components
    // and Stylus stylesheets
    console.log("Compiling static resources...");
    await buildStatic();

    // All static content is placed in the ./tmp directory
    // we use this directory as the root of our server
    const app = express()
      .use(bodyParser.urlencoded({ extended: true }))
      .use(cookieParser(server_settings.cookie_secret || "subway_secret"))
      .use(express.static(cwd + "/tmp"));

    app.set("views", __dirname + "/tmp");
    app.engine("ejs", require("ejs").renderFile);

    const server = http.Server(app);
    const io = require("socket.io")(server);

    // Get the port from the server settings based on environment
    const port = server_settings[env] ? server_settings[env].port : server_settings.dev.port;

    server.listen(port, () => {
      console.log(`Subway IRC client listening on port ${port}`);
    });

    // Pass the socket.io listener to the connection module
    // so it can handle incoming events and emit different actions
    connection(io, app);
  } catch (err) {
    console.error("Error starting Subway:", err);
    process.exit(1);
  }
}

// Start the application
startSubway();
