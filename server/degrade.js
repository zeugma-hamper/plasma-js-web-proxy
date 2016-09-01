var plasma = require('plasma-js-bridge');

var objMap = function(obj, iter) {
  var out = {};
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) return;
    out[key] = iter(obj[key]);
  }
  return out;
};

module.exports = function degrade(input) {
  if (input instanceof plasma.types.Vect) {
    return input.toArray();
  } else if (Array.isArray(input)) {
    return input.map(degrade);
  } else if (input !== null && typeof input === 'object') {
    return objMap(input, degrade);
  } else {
    return input;
  }
};

