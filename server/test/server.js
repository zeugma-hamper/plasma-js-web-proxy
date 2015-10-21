var assert = require('assert');
var plasma = require('plasma-js-bridge');
var sinon = require('sinon');
var Server = require('../server');
var sockjs = require('sockjs');
var EE = require('events').EventEmitter;
var Protocol = require('../../protocol');

describe('server', function() {
  var server;
  var sockServer;

  beforeEach(function() {
    sockServer = new EE();
    sockServer.installHandlers = function() {};
    sockjs.createServer = function() {
      return sockServer;
    };

    plasma.peek = sinon.spy(function() {
      // a mock child process
      return {
        kill: sinon.spy()
      };
    });
    plasma.poke = sinon.spy();

    server = new Server();
    server.registrar = {
      registerClientToPool: sinon.spy(),
      deregisterClientFromPool: sinon.spy(),
      deregisterClientFromAllPools: sinon.spy(),
    };

  });

  it('should service deposit requests', function() {
    var client = new EE();
    sockServer.emit('connection', client);
    var poolName = 'test-pool';
    var descrips = ['blah'];
    var ingests = { red: 'blue' };
    var message = Protocol.depositPool(poolName, descrips, ingests);
    client.emit('data', JSON.stringify(message));
    assert(plasma.poke.calledOnce);
    var args = plasma.poke.lastCall.args;
    assert.deepEqual(args[0], descrips);
    assert.deepEqual(args[1], ingests);
    assert.equal(args[2], poolName);
  });

  it('should service listen requests', function() {
    var client = new EE();
    client.write = sinon.spy();
    sockServer.emit('connection', client);
    var poolName = 'test-pool';
    var message = Protocol.listenPool(poolName);
    client.emit('data', JSON.stringify(message));
    assert(server.registrar.registerClientToPool.calledOnce);
    var args = server.registrar.registerClientToPool.lastCall.args;
    assert.equal(args[0], client);
    assert.equal(args[1], poolName);
  });

  it('should service unlisten requests', function() {
    var client = new EE();
    client.write = sinon.spy();
    sockServer.emit('connection', client);
    var poolName = 'test-pool';
    var message = Protocol.unlistenPool(poolName);
    client.emit('data', JSON.stringify(message));
    assert(server.registrar.deregisterClientFromPool.calledOnce);
    var args = server.registrar.deregisterClientFromPool.lastCall.args;
    assert.equal(args[0], client);
    assert.equal(args[1], poolName);
  });

  it('should respond to disconnections', function() {
    var client = new EE();
    client.write = sinon.spy();
    sockServer.emit('connection', client);
    client.emit('close');
    assert(server.registrar.deregisterClientFromAllPools.calledOnce);
    var args = server.registrar.deregisterClientFromAllPools.lastCall.args;
    assert.equal(args[0], client);
  });

});

