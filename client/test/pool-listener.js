var assert = require('assert');
var sinon = require('sinon');
var PoolListener = require('../pool-listener');
var Protocol = require('../../protocol');

var noop = function() {};

describe('PoolListener', function() {

  var requester;
  var listener;

  beforeEach(function() {
    requester = {
      connect: sinon.spy(),
      disconnect: sinon.spy()
    };
    listener = new PoolListener(requester);
  });

  var simulateConnect = function() {
    requester.connect.lastCall.args[1]();
  };

  describe('addPoolListener', function() {

    it('should request to connect to a pool', function() {
      var onConnect = function() {};
      listener.addPoolListener('some-pool', noop, onConnect);
      assert(requester.connect.calledOnce);
      assert.equal(requester.connect.lastCall.args[0], 'some-pool');
    });

    it('should not request to connect to a pool more than necessary', function() {
      listener.addPoolListener('some-pool', noop, noop);
      listener.addPoolListener('some-pool', noop, noop);
      assert(requester.connect.calledOnce);
      simulateConnect();
      listener.addPoolListener('some-pool', noop, noop);
      assert(requester.connect.calledOnce);
    });

    it('should request to connect to a pool if disconnected', function() {
      var onProtein = function() {};
      listener.addPoolListener('some-pool', onProtein, noop);
      listener.removePoolListener('some-pool', onProtein);
      listener.addPoolListener('some-pool', noop, noop);
      assert(requester.connect.calledTwice);
    });

    it('should call onSuccess callback upon connect', function() {
      var spy = sinon.spy();
      listener.addPoolListener('some-pool', function() {}, spy);
      simulateConnect();
      assert(spy.calledOnce);
    });

    it('should call onSuccess callback for all subsequent listeners, before or after connection', function(done) {
      var spy = sinon.spy();
      listener.addPoolListener('some-pool', noop, spy);
      listener.addPoolListener('some-pool', noop, spy);
      simulateConnect();
      listener.addPoolListener('some-pool', noop, spy);
      // Even if the pool is already connected, we still defer the callback, so
      // that the api is always asyncronous.
      // http://blog.ometer.com/2011/07/24/callbacks-synchronous-and-asynchronous/
      setTimeout(function() {
        assert(spy.calledThrice);
        done();
      }, 0);
    });

    it('should not require onSuccess', function() {
      listener.addPoolListener('some-pool', noop);
      simulateConnect();
    });

    it('should call protein listeners upon receiving proteins', function() {
      var spy = sinon.spy();
      var protein = {
        descrips: ['yo'],
        ingests: { 'color': 'blue' }
      };
      var meta = {
        pool: 'test-pool',
        index: -1,
        timestamp: 1
      };
      listener.addPoolListener('test-pool', spy);
      listener.consume(Protocol.zipProtein(protein, meta));
      assert(spy.calledOnce);
      var param = spy.lastCall.args[0];
      assert.deepEqual(param.descrips, protein.descrips);
      assert.deepEqual(param.ingests, protein.ingests);
      assert.equal(param.pool, meta.pool);
      assert.equal(param.index, meta.index);
      assert.equal(param.timestamp, meta.timestamp);
    });

    it('should not call protein listeners on the wrong pool', function() {
      var spy = sinon.spy();
      var protein = {
        descrips: ['yo'],
        ingests: { 'color': 'blue' }
      };
      var meta = {
        pool: 'test-pool',
        index: -1,
        timestamp: 1
      };
      listener.addPoolListener('other-pool', spy);
      listener.consume(Protocol.zipProtein(protein, meta));
      assert(spy.notCalled);
    });

  });

  describe('removePoolListener', function() {

    it('should remove listeners', function() {
      var spy = sinon.spy();
      var protein = {
        descrips: ['yo'],
        ingests: { 'color': 'blue' }
      };
      var meta = {
        pool: 'test-pool',
        index: -1,
        timestamp: 1
      };
      listener.addPoolListener('test-pool', spy);
      listener.removePoolListener('test-pool', spy);
      listener.consume(Protocol.zipProtein(protein, meta));
      assert(spy.notCalled);
    });

    it('should request disconnect no longer needed pools', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      listener.addPoolListener('test-pool', listener1);
      listener.addPoolListener('test-pool', listener2);
      listener.removePoolListener('test-pool', listener1);
      assert(requester.disconnect.notCalled);
      listener.removePoolListener('test-pool', listener2);
      assert(requester.disconnect.calledOnce);
    });

    it('returns true if listener removed and false otherwise', function() {
      assert.equal(listener.removePoolListener('wat', function() {}), false);
      var cb = function() {};
      listener.addPoolListener('pool-a', cb);
      assert.equal(listener.removePoolListener('pool-b', cb), false);
      assert.equal(listener.removePoolListener('pool-a', cb), true);
    });

  });

  describe('reconnectAll', function() {
    it('sends connect requests for all disconnected pools', function() {
      var callback = function() {};
      listener.addPoolListener('test-pool', callback);
      requester.connect.reset();
      listener.setDisconnected();
      listener.reconnectAll();
      assert(requester.connect.calledOnce);
    });
  });

});


