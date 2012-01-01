var MessageView = Backbone.View.extend({
  initialize: function() {
    this.render();
  },


  render: function() {
    $(this.el).html(this._linkify(this.model.getHtml()));
    return this;
  },

  // Find and link URLs
  _linkify: function(text) {
      // see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
      var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
      var parsed = text.replace(re, function(url) {
          // turn into a link
          var href = url;
          if (url.indexOf('http') !== 0) {
              href = 'http://' + url;
          }
          return '<a href="' + href + '" target="_blank">' + url + '</a>';
      });
      return parsed;
  }

});
