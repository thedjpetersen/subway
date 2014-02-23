var fs = require("fs");
var _ = require("underscore");
var client_settings = require("../settings/client");
var request = require("request");

var plugin_directory = __dirname + "/../plugin_cache/";

var get_plugin = function(plugin, callback) {
  var gist_id = plugin.split("/")[1];
  var output_directory = plugin_directory + gist_id;

  fs.exists(output_directory, function(exists) {
    // If the directory does not exist we want to create it
    if(!exists) {
      fs.mkdir(output_directory);
    }

    var base_url = "https://gist.githubusercontent.com/" + plugin + "/raw/"; 

    try {
      request(base_url + "plugin.json")
             .pipe(fs.createWriteStream(output_directory + '/plugin.json'));
      request(base_url + "plugin.js")
             .pipe(fs.createWriteStream(output_directory + '/plugin.js'));
      request(base_url + "plugin.css")
             .pipe(fs.createWriteStream(output_directory + '/plugin.css'));
      callback.call(this);
    } catch (err) {
      callback.call(this, err);
    }

  });
};

fs.exists(plugin_directory, function(exists) {
  if(!exists) {
    fs.mkdir(plugin_directory);
  }

  _.each(client_settings.plugins, function(value, key, list) {
    get_plugin(value);
  });
});


module.exports = get_plugin;
