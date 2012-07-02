var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
  
  
module.exports = function() {
  var Users = new Schema({
    username: { type: String , index: {unique: true}},
    password: String
  });
  
  var Connections = new Schema({
    user: String,
    hostname: String,
    port: Number,
    ssl: Boolean,
    selfSigned: Boolean,
    channels: [String],
    nick: String,
    password: String
  });
  
  var Messages = new Schema({
    user: String,
    message: String,
    date: { type: Date, default: Date.now }
  });
  
  var Channels = new Schema({
    user: String,
    name: String,
    server: String,
    messages: [Messages]
  });
  
  mongoose.model('User', Users);
  mongoose.model('Connection', Connections);
  mongoose.model('Channel', Channels);
  mongoose.model('Message', Messages);
};