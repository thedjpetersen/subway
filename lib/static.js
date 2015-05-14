var suspend = require("suspend");
var grunt = require("grunt");
var glob = require("glob");
var crypto = require("crypto");
var gaze = require("gaze");
var async = require("async");
var _ = require("underscore");
var env = process.env.IRC_ENV || "dev";

var js_files = [
  "src/libs/jquery/dist/jquery.js",
  "src/libs/underscore/underscore.js",
  "src/libs/backbone/backbone.js",
  "src/libs/react/react.js",
  "src/libs/react.backbone/react.backbone.js",
  "src/libs/socket.io-client/socket.io.js",
  "src/libs/moment/moment.js",
  "src/libs/modernizr/modernizr.js",
  "src/js/util.js",
  "src/js/boilerplate.js",
  "src/components/components.js"
];

var min_stamp = (new Date()).valueOf().toString();
min_stamp = min_stamp + '_' + crypto.randomBytes(20).toString('hex') + "_bundle.min.js";
min_stamp = "tmp/bundles/" + min_stamp;

var js_output = [];

var initialize = function(original_callback) {

  async.waterfall([
    function(callback) {
      grunt.task.init = function() {};
      glob("src/js/**/*.js", {}, function(er, additional_files) {
        callback(er, additional_files);
      });
    },
    function(additional_files, callback) {
      // Our IRC react file needs to go last

      js_files = _.union(js_files, _.without(additional_files, "src/js/app.js", "src/js/debug.js"), ["src/js/app.js"]);

      if(env === "dev") {
        js_output = js_output.concat(js_files);

        js_output = js_output.map(function(file) {
          return file.replace("src/", "");
        });
      } else {
        js_output = js_output.concat(min_stamp.replace("tmp/", ""));
      }

      grunt.initConfig({
        clean: ["tmp/"],
        jade: {
          compile: {
            options: {
              data: {
                css_output: ["libs/font-awesome/css/font-awesome.css", "css/subway.css"],
                js_output: js_output
              },
              pretty: true
            },
            files: {
              "tmp/index.ejs": "src/jade/index.jade",
              "tmp/debug.ejs": "src/jade/debug.jade"
            }
          }
        },
        less: {
          dist: {
            options: {
              paths: [
                "src/less",
                "src/libs/atom/static",
                "src/libs/atom/static/variables",
                "src/libs/atom-theme/stylesheets"
              ]
            },
            files: {
              "tmp/css/subway.css": "src/less/subway.less",
            }
          }
        },
        react: {
          main: {
            files: {
              "tmp/components/components.js": "src/new_components/**/*.jsx"
            }
          }
        },
        symlink: {
          main: {
            files: [
              {
                expand: false,
                src: "src/libs",
                dest: "tmp/libs"
              },
              {
                expand: false,
                src: "src/js",
                dest: "tmp/js"
              },
              {
                expand: false,
                src: "src/sounds",
                dest: "tmp/sounds"
              },
              {
                expand: false,
                src: "plugin_cache",
                dest: "tmp/plugin_cache"
              },
              {
                expand: false,
                src: "src/img",
                dest: "tmp/img"
              }
            ]
          }
        },
        uglify: {
          options: {
            report: "gzip"
          },
          main: {
            files: {
            }
          }
        }
      });

      grunt.config.data.uglify.main.files[min_stamp] = js_files;

      grunt.loadNpmTasks("grunt-react");
      grunt.loadNpmTasks("grunt-contrib-clean");
      grunt.loadNpmTasks("grunt-contrib-symlink");
      grunt.loadNpmTasks("grunt-contrib-jade");
      grunt.loadNpmTasks("grunt-contrib-less");
      grunt.loadNpmTasks("grunt-contrib-uglify");

      callback(null);
    }
  ], function (err, result) {
    original_callback.call();
  });
}

module.exports = function(cb) {
  initialize(function() {

    if (env === 'dev') {
      grunt.tasks(["clean", "symlink", "jade", "react", "less"], {}, cb);

      gaze("src/new_components/**/*.jsx", function(err, watcher) {
        this.on("all", function(event, filepath) {
          console.log("Change on: " + filepath);
          grunt.tasks(["react"], {}, function() {});
        });
      });

      gaze("src/jade/**/*.jade", function(err, watcher) {
        this.on("all", function(event, filepath) {
          console.log("Change on: " + filepath);
          grunt.tasks(["jade"], {}, function() {});
        });
      });

      gaze("src/less/**/*.less", function(err, watcher) {
        this.on("all", function(event, filepath) {
          console.log("Change on: " + filepath);
          grunt.tasks(["less"], {}, function() {});
        });
      });
    } else {
      // Include uglify command when running in prod
      grunt.tasks(["clean", "symlink", "jade", "react", "less", "uglify"], {}, cb);
    }
  });
}
