window.utils = {
  formatDate: function(date) {
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
  },

  // Find and link URLs
  // TODO: put youtube and image embedding code
  // into own function
  linkify: function(text) {
    // see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
    var links = [];
    var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
    var parsed = text.replace(re, function(url) {
      // turn into a link
      var href = url;
      if (url.indexOf('http') !== 0) {
        href = 'http://' + url;
      }
      links.push(href);
      return '<a href="' + href + '" target="_blank">' + url + '</a>';
    });
    if (links.length>0){
      //Look for embeddable media in all the links
      for (var i=0; i<links.length; i++){
        var href = links[i];
        
        //Add embedded youtube video
        var ytre = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/; // http://stackoverflow.com/questions/2964678/jquery-youtube-url-validation-with-regex/10315969#10315969
        var video_id = (href.match(ytre)) ? RegExp.$1 : false;
        if (video_id !== false) {
          parsed = parsed.split('</div><div class=\"chat-time\">').join(ich.youtube_embed({video_id:video_id}, true) + '</div><div class=\"chat-time\">');
        }

        //Add embedded images
        if (jQuery.inArray(href.substr(-3), ['jpg', 'gif', 'png']) > -1 || jQuery.inArray(href.substr(-4), ['jpeg']) > -1) {
          parsed = parsed.split('</div><div class=\"chat-time\">').join(ich.image_embed({link:href}, true) + '</div><div class=\"chat-time\">');
        }
      }
    }
    return parsed;
  },

  mentions: function(text) {
    var escape = function(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
    var re = new RegExp(escape(irc.me.get('nick')), 'g');
    var parsed = text.replace(re, function(nick) {
      return '<span class="mention">' + nick + '</span>';
    });
    return parsed;
  }

};
