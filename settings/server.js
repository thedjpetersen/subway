// Cache the plugin directory for a week
settings = {
  plugin_directory_expiry: 604800,
  dbadapter: "sqlite3",
  dbname: "subway.db",
  dbusername: "",
  dbpassword: "",
  dbhost: "",
  dbport: "",

  // Servers to which the client is allowed to connect to, restrict all the others
  // server_whitelist: ["irc.freenode.net"],
  server_whitelist: false,

  /* not implemented yet */
  user_access: {
    users_enabled: true,           // show and allow logins
    registration_enabled: true     // allow new users to register themselves
  },

  dev: {
    port: process.env.PORT || 3000
  },

  prod: {
    port: process.env.PORT || 14858 // Nodester port
  },

  use_polling: process.env.USE_POLLING || false, // Use polling if websockets aren't supported

  // limit each user's connection log to this amount of messages (***not implemented yet***)
  max_log_size: 4096
};


module.exports = settings;
