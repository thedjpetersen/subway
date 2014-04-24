// Utility method to parse references from a react form and return an object
_.parseForm = function(refs) {
  var out = {};
  _.each(refs, function(v,k) {
    out[k] = v.getDOMNode().value.trim();
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
