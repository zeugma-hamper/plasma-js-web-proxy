var plasma = require('plasma-js-bridge');

var objMap = function(obj, iter) {
  var out = {};
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) return;
    out[key] = iter(obj[key]);
  }
  return out;
};

/**
 * Degrades the input (usually a protein) into JSON-compatible types
 *
 * When a protein is received via plasma-js-bridge it often uses
 * custom types that are incompatible with JSON (e.g. Vect, Protein).
 *
 * This function is NOT GUARANTEED TO RETURN VALID JSON!! It will return
 * back unchanged any input that isn't explicitly handled and converted.
 */
module.exports = function degrade(input) {
  if (input instanceof plasma.types.Vect) {
    return input.toArray();
  } else if (input instanceof plasma.types.Array) {
    return input.toArray();
  } else if (Array.isArray(input)) {
    return input.map(degrade);
  } else if (input !== null && typeof input === 'object') {
    return objMap(input, degrade);
  } else {
    return input;
  }
};
