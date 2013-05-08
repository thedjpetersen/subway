module.exports = {
  debug: true,

  sqlite_path: process.env.DB_PATH || 'subway.db',

  // any connections with 'keep alive' selected should be reconnected on subway start
  restore_connections: true,

  /* not implemented yet */
  guest_access: {
    enabled: false,                 // allow guests to use this instance (no account mode)
    restrict_server: false,         // only allow the following server?
    server_host: 'freenode.net',    // filled in and greyed out
    server_port: 6667,              // filled in and greyed out
    restrict_channels: false,       // only allow certain channels to be joined
    channels: ['#subway'],          // the channels to permit
    show_details: true              // show the user the server/channel they're connecting to (if false, first channel in array is joined)
  },

  /* not implemented yet */
  user_access: {
      users_enabled: true,            // show and allow logins
      registration_enabled: true,     // allow new users to register themselves
      bouncer_mode_allowed: true      // allow IRC connections to persist when users disconnect
  },

  dev: {
    port: process.env.PORT || 3000,
    client_port: process.env.CLIENT_PORT || process.env.PORT || 3000
  },

  prod: {
      port: process.env.PORT || 14858, // Nodester port
    client_port: 80 // Websockets talk on port 80 on Nodester, regardless of listen port
  },

  // limit each user's connection log to this amount of messages (***not implemented yet***)
  max_log_size: 4096
};