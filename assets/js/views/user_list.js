var UserView = Backbone.View.extend({
  initialize: function(user) {
    this.user = user;
    this.setStatus();
  },

  className: 'userlist_user',

  render: function() {
    $(this.el).html(ich.userlist_user(this.user.model.attributes));
    return this;
  },

  addToIdle: function() {
    var idleTime = this.user.model.get('idle') + 1;
    if (idleTime > 60) {
      this.user.model.set({activity: '', user_status: 'idle'});
    } else {
      this.user.model.set({
        activity: '(' + idleTime + 'm)',
        idle: idleTime
      });
    }
    this.render();
  },

  setStatus: function() {
    // One-minute delays
    var self = this;
    var interval = 60 * 1000;
    setInterval(function() { self.addToIdle() }, interval);
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
    User.view = userView;
    $(this.el).append(userView.render().el);
  }
});
