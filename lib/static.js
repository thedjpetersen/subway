var suspend = require("suspend");
var grunt = require("grunt");
var glob = require("glob");
var crypto = require("crypto");
var gaze = require("gaze");
var _ = require("underscore");
var importer = require("rework-importer");
var env = process.env.IRC_ENV || "dev";

var js_files = [
  "src/libs/jquery/jquery.js",
  "src/libs/underscore/underscore.js",
  "src/libs/backbone/backbone.js",
  "src/libs/react/react.js",
  "src/libs/react.backbone/react.backbone.js",
  "src/libs/socket.io-client/dist/socket.io.js",
  "src/js/util.js",
  "src/js/boilerplate.js",
  "src/templates/templates.js"
];

var min_stamp = (new Date()).valueOf().toString();
min_stamp = min_stamp + '_' + crypto.randomBytes(20).toString('hex') + "_bundle.min.js";
min_stamp = "tmp/bundles/" + min_stamp;

var js_output = [];


suspend(function*() {
  grunt.task.init = function() {};

  var er, additional_files = yield glob("src/js/**/*.js", {}, suspend.resumeRaw())
  var er, template_files = yield glob("src/templates/**/*.jsx", {}, suspend.resumeRaw())

  template_files = template_files[1];

  js_files = _.union(js_files, _.without(additional_files[1], "src/js/app.js"), ["src/js/app.js"]);

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
          }
        },
        files: {
          "tmp/index.html": "src/jade/index.jade"
        }
      }
    },
    styl: {
      dist: {
        options: {
          whitespace: true,
          configure: function (styl) {
            styl
            .use(importer({path: "src/styl", whitespace: true}));
          }
        },
        files: {
          "tmp/css/subway.css": "src/styl/app.styl"
        }
      }
    },
    react: {
      main: {
        files: {
          "tmp/templates/templates.js": template_files
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

  grunt.loadNpmTasks("grunt-styl");
  grunt.loadNpmTasks("grunt-react");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-symlink");
  grunt.loadNpmTasks("grunt-contrib-jade");
  grunt.loadNpmTasks("grunt-contrib-uglify");
})();

module.exports = function(cb) {
  grunt.tasks(["clean", "symlink", "jade", "react", "styl", "uglify"], {}, cb);

  if (env === 'dev') {

    gaze("src/templates/**/*.jsx", function(err, watcher) {
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
  }
}
