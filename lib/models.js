module.exports = function (db, cb) {
  db.define('user', {
    username: String
    , password: String
    , joined: Date
  });

  db.define('connection', {
    user_id: Number
    , label: String               // how the user has labeled this connection
    , hostname: String            // host of the server
    , port: Number                // port of the server
    , nick: String                // nick to use on the server
    , away: String                // away message on the server
    , ssl: Boolean                // connect using ssl?
    , selfSigned: Boolean         // allow self signed ssl certs
    , encoding: Boolean
    , server_password: String     // password for logging into server
    , nickserv_password: String   // nickserv password for logging into 
    , nickserv_enabled: Boolean   // auth with nickserv?
    , sasl_enabled: Boolean
    , real_name: String           // real name to set for connection
    , creation: Date              // when this connection was created
    , disabled: Boolean           // is this connection prevented from starting?
    , disabled_timeout: Date      // do not allow the user to re-enable this connection until this date
    , disabled_reason: String     // why is this connection disabled? (could be user-initiated)
    , stay_online: Boolean        // keep this connection active even if the user is disconnected
    , temporary: Boolean          // this was created for a guest (no account)
  });

  db.define('message', {
    conn_id: Number
    , from: String
    , chan: String
    , at: Date
    , msg: String
  });

  db.define('pm', {
    conn_id: Number
    , from: String
    , at: Date
    , msg: String
    , read: Boolean
  });

  db.define('channel', {
    conn_id: Number
    , name: String
    , chanserv_enabled: Boolean
    , chanserv_password: String
  });

  return cb();
};