const fs = require("fs").promises;
const fsSync = require("fs");
const _ = require("underscore");
const client_settings = require("../settings/client");
const request = require("request");

const plugin_directory = __dirname + "/../plugin_cache/";

const self = {
  get_plugin: async function(plugin, callback) {
    const gist_id = plugin.split("/")[1];
    const output_directory = plugin_directory + gist_id;

    try {
      // Check if directory exists
      const exists = fsSync.existsSync(output_directory);

      if (exists) {
        // Plugin is already fetched - lets just return
        if (callback) { callback.call(); }
        return;
      }

      // Create directory if it doesn't exist
      await fs.mkdir(output_directory, { recursive: true });

      const base_url = "https://gist.githubusercontent.com/" + plugin + "/raw/";

      // Download all plugin files in parallel
      await Promise.all([
        new Promise((resolve, reject) => {
          request(base_url + "plugin.json")
            .pipe(fsSync.createWriteStream(output_directory + '/plugin.json'))
            .on('finish', resolve)
            .on('error', reject);
        }),
        new Promise((resolve, reject) => {
          request(base_url + "plugin.js")
            .pipe(fsSync.createWriteStream(output_directory + '/plugin.js'))
            .on('finish', resolve)
            .on('error', reject);
        }),
        new Promise((resolve, reject) => {
          request(base_url + "plugin.css")
            .pipe(fsSync.createWriteStream(output_directory + '/plugin.css'))
            .on('finish', resolve)
            .on('error', reject);
        })
      ]);

      if (callback) { callback.call(); }
    } catch (err) {
      if (callback) { callback(err); }
      else { throw err; }
    }
  },

  initialize: async function(callback) {
    try {
      // Check if plugin directory exists, create if it doesn't
      const exists = fsSync.existsSync(plugin_directory);
      if (!exists) {
        await fs.mkdir(plugin_directory, { recursive: true });
      }

      // Check if plugin registry needs to be updated
      try {
        const stat = await fs.stat(plugin_directory + '/plugin.json');
        const one_week_ago = new Date().getTime() - 604800000;

        // If the plugin registry is more than a week old, fetch it
        if (stat.mtime.getTime() < one_week_ago) {
          await new Promise((resolve, reject) => {
            request("https://raw.github.com/thedjpetersen/subway-plugins/master/plugins.json")
              .pipe(fsSync.createWriteStream(plugin_directory + '/plugins.json'))
              .on('finish', resolve)
              .on('error', reject);
          });
        }
      } catch (err) {
        // If stat fails, the file doesn't exist - fetch it
        if (err.code === 'ENOENT') {
          await new Promise((resolve, reject) => {
            request("https://raw.github.com/thedjpetersen/subway-plugins/master/plugins.json")
              .pipe(fsSync.createWriteStream(plugin_directory + '/plugins.json'))
              .on('finish', resolve)
              .on('error', reject);
          });
        }
      }

      // Download all plugins in parallel
      await Promise.all(
        client_settings.plugins.map(plugin =>
          self.get_plugin(plugin).catch(err => {
            console.error(`Error fetching plugin ${plugin}:`, err);
          })
        )
      );

      if (callback) { callback.call(); }
    } catch (err) {
      if (callback) { callback(err); }
      else { throw err; }
    }
  }
};

module.exports = self;
