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
  }
};
