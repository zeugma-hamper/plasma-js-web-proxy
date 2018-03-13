let assert = require('assert');
let gelatin = require('gelatin');
let degrade = require('../degrade-gelatin');

describe('degrade-gelatin', function() {

  it('should turn gelatin Vects into arrays', function() {
    let vect = new gelatin.Vect([1, 2, 3]);
    let output = degrade(vect);
    assert.deepEqual(output, [1, 2, 3]);
  });

  it('should turn gelatin Vect2s into arrays', function() {
    let vect = new gelatin.Vect2([1.1, 2.2]);
    let output = degrade(vect);
    assert.deepEqual(output, [1.1, 2.2]);
  });

  it('should turn gelatin Vect2is into arrays', function() {
    let vect = new gelatin.Vect2i([1, 2]);
    let output = degrade(vect);
    assert.deepEqual(output, [1, 2]);
  });

  it('should turn gelatin Vect4s into arrays', function() {
    let vect = new gelatin.Vect4([1.1, 2.2, 3.3, 4.4]);
    let output = degrade(vect);
    assert.deepEqual(output, [1.1, 2.2, 3.3, 4.4]);
  });

  it('should recurse through objects', function() {
    let input = {
      vect: new gelatin.Vect([1, 2, 3])
    };
    let output = degrade(input);
    assert.deepEqual(output, { vect: [1, 2, 3] });
  });

  it('should recurse through arrays', function() {
    let input = [
      new gelatin.Vect([1, 2, 3])
    ];
    let output = degrade(input);
    assert.deepEqual(output, [[1, 2, 3]]);
  });

});
