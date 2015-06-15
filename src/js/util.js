// Utility method to parse references from a react form and return an object
_.parseForm = function(refs) {
  var out = {};
  var val, node;
  _.each(refs, function(v,k) {
    node = v.getDOMNode();
    val = node.value.trim();

    if (node.type && node.type === "checkbox") {
      val = node.checked;
    }

    if (val !== "") {
      out[k] = val;
    }
  });
  return out;
};

_.validateForm = function(refs) {
  var isValid = true;
  _.each(refs, function(v,k) {
    var domNode = $(v.getDOMNode());
    var val = domNode.val();
    if(val === "" && domNode.attr("required")) {
      domNode.addClass("required");
      isValid = false ;
    } else {
      domNode.removeClass("required");
    }
  });

  return isValid;
};

_.makeWorkingButton = function(node) {
  var oldHTML = node.innerHTML;

  node.restore = function() {
    node.innerHTML = oldHTML;
    node.classList.remove("disabled");
  };

  node.classList.add("disabled");
  var icon = document.createElement("i");
  icon.classList.add("fa", "fa-circle-o-notch", "fa-spin", "spacing-left");
  node.appendChild(icon);

  return node;
}
