var Message = Backbone.Model.extend({
    defaults: {
        // expected properties:
        // - sender
        // - raw
        'type': 'message'
    },

    initialize: function() {
        if (this.get('raw')) {
            this.set({text: this.parse( _.escape(this.get('raw')) )});
        }
    },

    parse: function(text) {
        return this._linkify(text);
    },

    // Set output text for status messages
    setText: function() {
        var text = '';
        switch (this.get('type')) {
            case 'join':
                text = this.get('nick') + ' joined the channel';
                break;
            case 'part':
                text = this.get('nick') + ' left the channel';
                break;
            case 'nick':
                text = this.get('oldNick') + ' is now known as ' + this.get('newNick');
                break;
        }
        this.set({text: text});
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


// Represents any type of chat window -- a channel, private message,
// or the status/console window.
var ChatWindow = Backbone.Model.extend({
    // expected properties:
    // - name
    defaults: {
        type: 'channel',
        active: true
    },

    initialize: function() {
        this.stream = new Stream;
        this.users = new UserList;
    },

    part: function() {
        console.log('Leaving ' + this.get('name'));
        this.destroy();
    }

});

var User = Backbone.Model.extend({
    defaults: {
        opStatus: ''
    }
});

