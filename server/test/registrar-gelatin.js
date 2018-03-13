let assert = require('assert');
let gelatin = require('gelatin');
let sinon = require('sinon');
let Registrar = require('../registrar-gelatin.js');

describe('registrar-gelatin', function() {
  let registrar;

  let makeClient = function() {
    return {
      write: sinon.spy()
    };
  };

  beforeEach(function() {
    registrar = new Registrar();
    gelatin.peek = sinon.spy(function() {
      // a mock child process
      return {
        end: sinon.spy(),
        on: sinon.spy()
      };
    });
    gelatin.depositor = sinon.spy();
  });

  it('should register a peek listener', function() {
    registrar.registerClientToPeek(makeClient(), 'test-pool');
    assert(gelatin.peek.calledOnce);
  });

  it('should not peek a single pool more than once', function() {
    registrar.registerClientToPeek(makeClient(), 'test-pool');
    registrar.registerClientToPeek(makeClient(), 'test-pool');
    assert(gelatin.peek.calledOnce);
  });

  it('should kill peek when no longer needed', function() {
    let clientA = makeClient();
    registrar.registerClientToPeek(clientA, 'pool-1');
    registrar.deregisterClientFromPool(clientA, 'pool-1');
    let lastPeek = gelatin.peek.lastCall.returnValue;
    assert(lastPeek.end.calledOnce);
    registrar.registerClientToPeek(clientA, 'pool-2');
    registrar.deregisterClientFromAllPools(clientA, 'pool-2');
    lastPeek = gelatin.peek.lastCall.returnValue;
    assert(lastPeek.end.calledOnce);
  });

  it('should not kill peek while still needed', function() {
    let clientA = makeClient();
    let clientB = makeClient();
    registrar.registerClientToPeek(clientA, 'pool-1');
    registrar.registerClientToPeek(clientB, 'pool-1');
    registrar.deregisterClientFromPool(clientB, 'pool-1');
    let lastPeek = gelatin.peek.returnValues[0];
    assert(lastPeek.end.notCalled);
  });

});
