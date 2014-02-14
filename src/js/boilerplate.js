window.app = {
  models: {},
  collections: {},
  components: {},
  irc: {
  }
};

app.io = io.connect(null, {port: document.location.port});
