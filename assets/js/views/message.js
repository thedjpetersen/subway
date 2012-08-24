var MessageView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },

  className: 'message-box',

  render: function() {
    var nick = this.model.get('sender') || this.model.collection.channel.get('name');
    var html;

    if (_.include(['join', 'part', 'nick', 'topic', 'quit'], this.model.get('type')))
      html = this.setText(this.model.get('type'));
    // This handles whether to output a message or an action
    else if (this.model.get('text') && this.model.get('text').substr(1, 6) === 'ACTION') {
      html = ich.action({
        user: nick,
        content: this.model.get('text').substr(8),
        renderedTime: utils.formatDate(Date.now())
      }, true);
      html = this.model.parse(html);
    } else {
      html = ich.message({
        user: nick,
        type: this.model.get('type'),
        content: this.model.get('text'),
        renderedTime: utils.formatDate(Date.now())
      }, true);
      html = this.model.parse(html);
    }

    $(this.el).html(html);
    return this;
  },

  // Set output text for status messages
  setText: function(type) {
    var html = '';
    switch (type) {
      case 'join':
      case 'part':
        html = ich.join_part({
          type: type,
          nick: this.model.get('nick'),
          action: type === 'join' ? 'joined' : 'left'
        });
        break;
      case 'quit':
        html = ich.join_part({
          type: 'part',
          nick: this.model.get('nick'),
          action: 'left',
          reason: this.model.get('reason') !== 'undefined' ? '('+this.model.get('reason')+')' : '(leaving)'
          //Message resolving to undefined will include again later
          //message: '(' + this.model.get('message') + ')'
        });
        break;
      case 'nick':
        html = ich.nick({
          oldNick: this.model.get('oldNick'),
          newNick: this.model.get('newNick')
        });
        break;
      case 'topic':
        html = '<span class="topic_img"></span><b>' + this.model.get('nick') + '</b> has changed the topic to <i>' + this.model.get('topic') + '</i>';
        break;
    }
    return html;
  }

});
