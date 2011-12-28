//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.7.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/ICanHaz.min.js'
//= require_tree 'models'
//= require_tree 'views'

var ChatApplicationRouter = Backbone.Router.extend({
  initialize: function(options) {
    this.socket = io.connect();
    this.model = new ChatApplicationModel();
    this.view = new ChatApplicationView({model: this.model, socket: this.socket});
  }
});

$(function() {
  window.connected = false;
  window.app = new ChatApplicationRouter();
})
