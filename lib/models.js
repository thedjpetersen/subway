const uuid = require('uuid');
const config = require("../settings/server");
const Schema = require('jugglingdb').Schema;

const schema = new Schema(config.dbadapter, {
  database: config.dbname,
  username: config.dbusername,
  password: config.dbpassword,
  host: config.dbhost,
  port: config.dbport
});

module.exports = function () {
  schema.define('User', {
    user_id:     { type: String, default: () => uuid.v1() },
    username:    { type: String },
    password:    { type: String },
    joined:      { type: Date, default: () => new Date() },
    session_id:  { type: String }
  });

  schema.define('Message', {
    server:      { type: String },
    from:        { type: String },
    to:          { type: String },
    type:        { type: String },
    timestamp:   { type: Date, default: () => new Date() },
    text:        { type: String },
    attributes:  { type: String }
  });

  schema.define('Connection', {
    user_id:         { type: String },
    connection_data: { type: Schema.Text } // This is a JSON object
  });

  schema.define('Settings', {
    user_id:  { type: String },
    settings: { type: Schema.Text } // This is a JSON object
  });

  schema.autoupdate();

  return schema;
};
