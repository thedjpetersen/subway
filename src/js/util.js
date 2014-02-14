// Utility method to parse references from a react form and return an object
_.parseForm = function(refs) {
  var out = {};
  _.each(refs, function(v,k) {
    out[k] = v.getDOMNode().value.trim();
  });
  return out;
}
