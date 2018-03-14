let gelatin = require('gelatin');

var realMap = function(obj, iter) {
  var out = {};
  for (var kv of obj) {
    out[kv[0]] = iter(kv[1]);
  }
  return out;
};

var objMap = function(obj, iter) {
  var out = {};
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) return;
    out[key] = iter(obj[key]);
  }
  return out;
};

/**
 * Degrades the input (a gelatin protein) into JSON-compatible types
 *
 * When a protein is received via gelatin it often uses
 * custom types that are incompatible with JSON (e.g. Vect, Protein).
 *
 * This function is NOT GUARANTEED TO RETURN VALID JSON!! It will return
 * back unchanged any input that isn't explicitly handled and converted.
 */
module.exports = function degrade(input) {
  if (input instanceof gelatin.Protein) {
    const dsc = degrade(input.descrips);
    const ing = degrade(input.ingests);
    // degraded protein should ONLY have descrips and ingests fields
    return {descrips:dsc, ingests:ing};
  } else if (input instanceof gelatin.Vect) {
    return [input.x, input.y, input.z];
  } else if (input instanceof gelatin.Vect2) {
    return [input.x, input.y];
  } else if (input instanceof gelatin.Vect2i) {
    return [input.x, input.y];
  } else if (input instanceof gelatin.Vect4) {
    return [input.x, input.y, input.z, input.w];
  } else if (Array.isArray(input)) {
    return input.map(degrade);
  } else if (input !== null && input instanceof Map) {
    return realMap(input, degrade);
  } else if (input !== null
	  && Object.getPrototypeOf(input) === Object.prototype) {
    return objMap(input, degrade);
  } else if (typeof input === 'string' || typeof input === 'number'
	  || typeof input === 'boolean') {
    return input;
  } else {
    return null;
  }
};
