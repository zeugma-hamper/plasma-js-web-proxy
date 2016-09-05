var assert = require('assert');
var plasma = require('plasma-js-bridge');
var degrade = require('../degrade');

describe('degrade', function() {

  it('should turn plasma vects into arrays', function() {
    var vect = new plasma.types.Vect(1, 2, 3);
    var output = degrade(vect);
    assert.deepEqual(output, [1, 2, 3]);
  });

  it('should turn plasma.arrays into arrays', function() {
    var vect = new plasma.types.Array([1, 2, 3]);
    var output = degrade(vect);
    assert.deepEqual(output, [1, 2, 3]);
  });

  it('should recurse through objects', function() {
    var input = {
      vect: new plasma.types.Vect(1, 2, 3)
    };
    var output = degrade(input);
    assert.deepEqual(output, { vect: [1, 2, 3] });
  });

  it('should recurse through arrays', function() {
    var input = [
      new plasma.types.Vect(1, 2, 3)
    ];
    var output = degrade(input);
    assert.deepEqual(output, [[1, 2, 3]]);
  });

});

