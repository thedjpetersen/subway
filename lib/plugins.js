var fs = require("fs");
var _ = require("underscore");
var client_settings = require("../settings/client");
var request = require("request");
var async = require("async");

var plugin_directory = __dirname + "/../plugin_cache/";

var self = {
  get_plugin: function(plugin, callback) {
    var gist_id = plugin.split("/")[1];
    var output_directory = plugin_directory + gist_id;

    fs.exists(output_directory, function(exists) {
      // If the directory does not exist we want to create it
      if(!exists) {
        fs.mkdir(output_directory);
      } else {
        // Plugin is already fetched - lets just return
        if (callback) { callback.call(); }
        return;
      }

      var base_url = "https://gist.githubusercontent.com/" + plugin + "/raw/"; 

      async.parallel([
        function(cb) {
          request(base_url + "plugin.json", cb)
                 .pipe(fs.createWriteStream(output_directory + '/plugin.json'));
        },
        function(cb) {
          request(base_url + "plugin.js", cb)
                 .pipe(fs.createWriteStream(output_directory + '/plugin.js'));
        },
        function(cb) {
          request(base_url + "plugin.css", cb)
                 .pipe(fs.createWriteStream(output_directory + '/plugin.css'));
        },
      ], callback);

    });
  },

  initialize: function(callback) {
    fs.exists(plugin_directory, function(exists) {
      if(!exists) {
        fs.mkdir(plugin_directory);
      }

      fs.stat(plugin_directory + '/plugin.json', function(err, stat) {
        var one_week_ago = new Date().getTime()-604800000;

        // If the plugin registry is not created
        // or more than a week old we want to fetch it
        if (stat === undefined || stat.mtime.getTime() < one_week_ago) {
          // Grab plugin index
          result = request("https://raw.github.com/thedjpetersen/subway-plugins/master/plugins.json")
                 .pipe(fs.createWriteStream(plugin_directory + '/plugins.json'));
        }
      });

      async.each(client_settings.plugins, function(value, cb) {
        self.get_plugin(value, cb);
      }, function() {
        callback.call();
      });
    });
  }
};

module.exports = self;
