var client_settings = require("../../settings/client");

var handler = function(req, res) {
  res.render("index.ejs", {settings: JSON.stringify(client_settings)});
};

module.exports = handler;
