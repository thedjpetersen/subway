// Collection of messages that belong to a frame
var Stream = Backbone.Collection.extend({
    model: Message
});

// All channels/private message chats a user has open
var WindowList = Backbone.Collection.extend({
    model: ChatWindow,

    getByName: function(name) {
        return this.detect(function(frame) {
            return frame.get('name') == name;
        });
    },

    getActive: function() {
        return this.detect(function(frame) {
            return frame.get('active') == true;
        });
    },

    setActive: function(frame) {
        this.each(function(frm) {
            frm.set({active: false});
        });

        frame.set({active: true});
    },

    getChannels: function() {
        return this.filter(function(frame) {
            return frame.get('type') == 'channel';
        });
    }

});

var UserList = Backbone.Collection.extend({
    model: User,
    getByNick: function(nick) {
        return this.detect(function(user) {
            return user.get('nick') == nick;
        });
    }
});

