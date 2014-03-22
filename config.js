module.exports = {
  debug: false,

  dbadapter: process.env.DB_ADAPTER || 'sqlite3',
  dbname: process.env.DB_PATH || 'subway.db',
  dbusername: process.env.DB_USER || '',
  dbpassword: process.env.DB_PASSWD || '',
  dbhost: process.env.DB_HOST || '',
  dbport: process.env.DB_PORT || '',

  // any connections with 'keep alive' selected should be reconnected on subway start
  restore_connections: true,

  // Servers to which the client is allowed to connect to, restrict all the others
  // server_whitelist: ["irc.freenode.net"],
  server_whitelist: false,

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
  max_log_size: 4096,

  // How long you want to store a cookie, both server and client side, in hours.
  cookie_time: 7 * 24,

  // Secret key used to generate a unique and secure session cookie hash.
  secret_key: "MY-SUPER-SECRET-KEY"
};
