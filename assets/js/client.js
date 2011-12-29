//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.7.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/ICanHaz.min.js'
//= require 'models.js'
//= require 'collections.js'
//= require_tree 'views'

var ChatApplicationRouter = Backbone.Router.extend({
  initialize: function(options) {
    this.socket = io.connect();
    this.model = new ChatApplicationModel;
    this.view = new ChatApplicationView;
  }
});

$(function() {
  window.app = new ChatApplicationRouter;

  // Global object
  window.irc = {
    chatWindows: new ChatWindow
  };


  // EVENTS //


  // Registration (server joined)
  app.socket.on('registered', function(data) {
    irc.chatWindows.getByName('status').stream.add({sender: '', raw: data.message});
  });

  // Message of the Day
  app.socket.on('motd', function(data) {
    data.motd.split('\n').forEach(function(line) {
      irc.chatWindows.getByName('status').stream.add({sender: '', raw: line});
    });
  });


})

