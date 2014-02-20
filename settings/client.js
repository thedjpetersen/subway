// inspired by http://stackoverflow.com/a/5870544/324085
var settings = {};

settings.highlights = [
  {
    regex: "\\b(<%= connection.get(\"nick\") %>)\\b",
    color: "#0B2666",
    name: "mentions"
  }
];

module.exports = settings;
