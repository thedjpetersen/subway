module.exports = function (schema) {
  schema.define('User', {
    user_id:     { type: String },
    username:    { type: String },
    password:    { type: String },
    joined:      { type: Date, default: function () { return new Date; } }
  });

  schema.define('Connection', {
    user_id: { type: String }
    , label: { type: String }               // how the user has labeled this connection
    , hostname: { type: String }            // host of the server
    , port: { type: Number }                // port of the server
    , nick: { type: String }               // nick to use on the server
    , away: { type: String }                // away message on the server
    , ssl: { type: Boolean }                // connect using ssl?
    , selfSigned: { type: Boolean }        // allow self signed ssl certs
    , encoding: { type: String }
    , server_password: { type: String }     // password for logging into server
    , nickserv_password: { type: String }   // nickserv password for logging into 
    , nickserv_enabled: { type: Boolean }   // auth with nickserv?
    , sasl_enabled: { type: Boolean }
    , real_name: { type: String }           // real name to set for connection
    , creation: { type: Date, default: function () { return new Date; } }              // when this connection was created
    , disabled: { type: Boolean }           // is this connection prevented from starting?
    , disabled_timeout: { type: Date }      // do not allow the user to re-enable this connection until this date
    , disabled_reason: { type: String }     // why is this connection disabled? (could be user-initiated)
    , keep_alive: { type: Boolean }          // keep this connection active even if the user is disconnected
    , stripColors: { type: Boolean }        // Do not highlight colors
    , temporary: { type: Boolean }          // this was created for a guest (no account)
  });

  schema.define('Message', {
    conn_id:     { type: Number },
    by:          { type: String },
    chan:        { type: String },
    at:          { type: Date, default: function () { return new Date; } },
    msg:         { type: String }
  });

  schema.define('PM', {
    conn_id:     { type: Number },
    by:          { type: String },
    at:          { type: Date, default: function () { return new Date; } },
    msg:         { type: String }
  });

  schema.define('Channel', {
    conn_id:            { type: Number },
    name:               { type: String },
    chanserv_enabled:   { type: Boolean },
    chanserv_password:  { type: String }
  });

  schema.define('Session', {
    auth_token:         { type: String },
    username:           { type: String },
    user_id:            { type: String },
    expires:            { type: Date }
  });

  schema.autoupdate();

  return schema;
};
