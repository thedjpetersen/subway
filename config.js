module.exports = {
  debug: false,

  dbadapter: 'sqlite3',
  dbname: process.env.DB_PATH || 'subway.db',
  dbusername: '',
  dbpassword: '',
  dbhost: '',
  dbport: '',

  // any connections with 'keep alive' selected should be reconnected on subway start
  restore_connections: true,

  // Servers to which the client is allowed to connect to, restrict all the others
  // server_whitelist: ["irc.freenode.net"],
  server_whitelist: false,

  // If enabled, prevent creation of new accounts or editing settings.  These presets
  // are used for all new user accounts.
  presets: false,
  /*
  presets: {
    server: "chat.freenode.net",
    port: 6667,
    secure: false,
    selfSigned: false,
    away: "AKF",
    encoding: null,
    stripColors: false,
    keepAlive: true,
    channels: ["#subway"],
  },
  */

  /* not implemented yet */
  user_access: {
      users_enabled: true,            // show and allow logins
      registration_enabled: true,     // allow new users to register themselves
      bouncer_mode_allowed: true      // allow IRC connections to persist when users disconnect
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
