var UserView = Backbone.View.extend({
  initialize: function(user) {
    this.user = user;
  },

  className: 'userlist_user',

  render: function() {
    $(this.el).html(ich.userlist_user(this.user.model.attributes));
    return this;
  }
});

var UserListView = Backbone.View.extend({
  initialize: function() {
    this.el = this.collection.channel.view.$('#user-list');
    this.collection.bind('add', this.add, this);
  },

  render: function() {
    return this;
  },

  add: function(User) {
    var userView = new UserView({model: User});
    $(this.el).append(userView.render().el);
  }
});
