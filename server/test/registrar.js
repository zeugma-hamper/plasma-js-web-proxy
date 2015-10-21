var assert = require('assert');
var plasma = require('plasma-js-bridge');
var sinon = require('sinon');
var Registrar = require('../registrar.js');

describe('registrar', function() {
  var registrar;

  var makeClient = function() {
    return {
      write: sinon.spy()
    };
  };

  beforeEach(function() {
    registrar = new Registrar();
    plasma.peek = sinon.spy(function() {
      // a mock child process
      return {
        kill: sinon.spy()
      };
    });
    plasma.poke = sinon.spy();
  });

  it('should register a peek listener', function() {
    registrar.registerClientToPool(makeClient(), 'test-pool');
    assert(plasma.peek.calledOnce);
  });

  it('should not peek a single pool more than once', function() {
    registrar.registerClientToPool(makeClient(), 'test-pool');
    registrar.registerClientToPool(makeClient(), 'test-pool');
    assert(plasma.peek.calledOnce);
  });

  it('should kill peek when no longer needed', function() {
    var clientA = makeClient();
    registrar.registerClientToPool(clientA, 'pool-1');
    registrar.deregisterClientFromPool(clientA, 'pool-1');
    var lastPeek = plasma.peek.lastCall.returnValue;
    assert(lastPeek.kill.calledOnce);
    registrar.registerClientToPool(clientA, 'pool-2');
    registrar.deregisterClientFromAllPools(clientA, 'pool-2');
    lastPeek = plasma.peek.lastCall.returnValue;
    assert(lastPeek.kill.calledOnce);
  });

  it('should not kill peek while still needed', function() {
    var clientA = makeClient();
    var clientB = makeClient();
    registrar.registerClientToPool(clientA, 'pool-1');
    registrar.registerClientToPool(clientB, 'pool-1');
    registrar.deregisterClientFromPool(clientB, 'pool-1');
    var lastPeek = plasma.peek.returnValues[0];
    assert(lastPeek.kill.notCalled);
  });

  it('writes incoming proteins to clients', function() {
    var clientA = makeClient();
    var clientB = makeClient();
    var protein = {
      descrips: [],
      ingests: {}
    };
    registrar.registerClientToPool(clientA, 'test-pool');
    registrar.registerClientToPool(clientB, 'test-pool');
    var lastPeekArgs = plasma.peek.lastCall.args;
    lastPeekArgs[1](protein);
    assert(clientA.write.calledOnce);
    assert(clientB.write.calledOnce);
  });

});


