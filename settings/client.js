// inspired by http://stackoverflow.com/a/5870544/324085
var settings = {};

settings.highlights = [
  {
    regex: "\\b(<%= connection.get(\"nick\") %>)\\b",
    color: "#0B2666",
    name: "mentions",
    notify: true
  }
];

settings.plugins = [
  // Youtube embed
  "thedjpetersen/9140203",
  "thedjpetersen/9265479"
];

settings.time_format = "HH:mm";

// If you don't 
settings.enabled_types = [
  "PRIVMSG",
  "NOTICE",
  "MODE",
  "PART",
  "QUIT",
  "KICK",
  "JOIN",
  "TOPIC",
  "NICK",
  "ACTION"
];

settings.disabled_types = [];

settings.notify_pm = true;

module.exports = settings;
