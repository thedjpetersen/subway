var MessageView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'message-box',

  render: function() {
    var nick = this.model.get('sender') || this.model.collection.channel.get('name');
    var html;

    // This handles whether to output a message or an action
    if (this.model.get('text').substr(1, 6) === 'ACTION') {
      html = ich.action({
        user: nick,
        content: this.model.get('text').substr(8),
        renderedTime: this._formatDate(Date.now())
      }, true);
    } else {
      html = ich.message({
        user: nick,
        type: this.model.get('type'),
        content: this.model.get('text'),
        renderedTime: this._formatDate(Date.now())
      }, true);
    }

    $(this.el).html(html);
    return this;
  },

  _formatDate: function (date) {
    var d = new Date(date);
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12) {
      h = hh-12;
      dd = "PM";
    }
    if (h == 0) {
      h = 12;
    }
    m = m<10?"0"+m:m;

    s = s<10?"0"+s:s;

    /* if you want 2 digit hours:
    h = h<10?"0"+h:h; */

    var replacement = h+":"+m;
    /* if you want to add seconds
    repalcement += ":"+s;  */
    replacement += " "+dd;

    return d.toDateString() + ', ' + replacement;
  }

});
