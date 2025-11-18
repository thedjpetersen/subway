const grunt = require("grunt");
const glob = require("glob");
const crypto = require("crypto");
const gaze = require("gaze");
const _ = require("underscore");
const importer = require("rework-importer");
const { promisify } = require("util");

const env = process.env.IRC_ENV || "dev";
const globAsync = promisify(glob);

const js_files = [
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

let min_stamp = (new Date()).valueOf().toString();
min_stamp = min_stamp + '_' + crypto.randomBytes(20).toString('hex') + "_bundle.min.js";
min_stamp = "tmp/bundles/" + min_stamp;

let js_output = [];

async function initialize() {
  grunt.task.init = function() {};

  // Get all additional JavaScript files
  const additional_files = await globAsync("src/js/**/*.js", {});

  // Get all component files
  let component_files = await globAsync("src/components/**/*.jsx", {});

  // Our IRC react file needs to go last
  component_files = _.without(component_files, "src/components/irc.jsx").concat("src/components/irc.jsx");

  // Combine JavaScript files in the correct order
  const all_js_files = _.union(
    js_files,
    _.without(additional_files, "src/js/app.js", "src/js/debug.js"),
    ["src/js/app.js"]
  );

  if (env === "dev") {
    js_output = all_js_files.map(file => file.replace("src/", ""));
  } else {
    js_output = [min_stamp.replace("tmp/", "")];
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
    styl: {
      dist: {
        options: {
          whitespace: true,
          configure: function (styl) {
            styl.use(importer({path: "src/styl", whitespace: true}));
          }
        },
        files: {
          "tmp/css/debug.css": "src/styl/debug.styl",
          "tmp/css/subway.css": "src/styl/app.styl"
        }
      }
    },
    react: {
      main: {
        files: {
          "tmp/components/components.js": component_files
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
        files: {}
      }
    }
  });

  grunt.config.data.uglify.main.files[min_stamp] = all_js_files;

  grunt.loadNpmTasks("grunt-styl");
  grunt.loadNpmTasks("grunt-react");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-symlink");
  grunt.loadNpmTasks("grunt-contrib-jade");
  grunt.loadNpmTasks("grunt-contrib-uglify");
}

module.exports = async function(cb) {
  try {
    await initialize();

    if (env === 'dev') {
      grunt.tasks(["clean", "symlink", "jade", "react", "styl"], {}, cb);

      gaze("src/components/**/*.jsx", function(err, watcher) {
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

      gaze("src/styl/**/*.styl", function(err, watcher) {
        this.on("all", function(event, filepath) {
          console.log("Change on: " + filepath);
          grunt.tasks(["styl"], {}, function() {});
        });
      });
    } else {
      // Include uglify command when running in prod
      grunt.tasks(["clean", "symlink", "jade", "react", "styl", "uglify"], {}, cb);
    }
  } catch (err) {
    cb(err);
  }
}
