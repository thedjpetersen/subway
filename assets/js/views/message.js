var MessageView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'message-box',

  render: function() {
    var nick = this.model.get('sender') || this.model.collection.channel.get('name');
    var html;

    if (_.include(['join', 'part', 'nick'], this.model.get('type')))
      html = this.setText(this.model.get('type'));
    // This handles whether to output a message or an action
    else if (this.model.get('text').substr(1, 6) === 'ACTION') {
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

  // Set output text for status messages
  setText: function(type) {
    var html = '';
    switch (type) {
      case 'join':
        html = '<span class="join_img"></span><b>' + this.model.get('nick') + '</b> joined the channel';
        break;
      case 'part':
        html = '<span class="part_img"></span><b>' + this.model.get('nick') + '</b> left the channel';
        break;
      case 'nick':
        html = '<b>' + this.model.get('oldNick') + '</b> is now known as ' + this.model.get('newNick');
        break;
    }
    return html;
  },

  _formatDate: function(date) {
    var d = new Date(date);
    var hh = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var dd = "AM";
    var h = hh;
    if (h >= 12) {
      h = hh - 12;
      dd = "PM";
    }
    if (h == 0) {
      h = 12;
    }

    m = m < 10 ? "0" + m:m;
    s = s < 10 ? "0" + s:s;

    var replacement = h + ":" + m + " " + dd;
    return d.toDateString() + ', ' + replacement;
  }

});
