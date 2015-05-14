var client_settings = require("../../settings/client");

var handler = function(req, res) {
  res.render("index.ejs", {settings: client_settings});
};

module.exports = handler;
