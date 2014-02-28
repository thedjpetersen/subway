// inspired by http://stackoverflow.com/a/5870544/324085
var settings = {};

settings.highlights = [
  {
    regex: "\\b(<%= connection.get(\"nick\") %>)\\b",
    color: "#0B2666",
    name: "mentions"
  }
];

settings.plugins = [
  // Youtube embed
  "thedjpetersen/9140203",
  "thedjpetersen/9265479"
];

settings.time_format = "HH:MM";

module.exports = settings;
