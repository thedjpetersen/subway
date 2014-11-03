(function() {
  var socket = io("/debug");

  socket.on("raw", function(message) {
    console.log(message);
    var irc_log = document.querySelectorAll(".irc_log")[0];
    irc_log.innerHTML = irc_log.innerHTML + "<div class='irc_msg'>" + JSON.stringify(message) + "</div>";
  });
})();
