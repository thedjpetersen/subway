var Backbone = require("backbone");

var session = Backbone.Model.extend({
  id: "username"
});

var sessions = Backbone.Collection.extend({
  model: session
});

module.exports = new sessions();
