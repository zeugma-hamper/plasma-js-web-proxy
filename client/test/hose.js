var assert = require('assert');
var sinon = require('sinon');
var Hose = require('../hose');

describe('Hose', function() {

  var poolListener;
  var requester;

  beforeEach(function() {
    poolListener = {
      addPoolListener: sinon.spy(),
      removePoolListener: sinon.spy()
    };

    requester = {
      Connect: sinon.spy(),
      Deposit: sinon.spy()
    };
  });

  var deposit = function(d, i) {
    var listeners = poolListener.addPoolListener.args.map(function(args) {
      return args[1];
    });

    listeners.forEach(function(listener) {
      listener.call(this, { descrips: d, ingests: i || {} });
    });
  };

  describe('.await()', function() {

    var hose;

    beforeEach(function() {
      hose = new Hose(requester, poolListener, 'test-pool');
    });

    it('does not require any descrip filters', function() {
      var spy = sinon.spy();
      hose.await(spy);
      deposit(['blue', 'red', 'green']);
      assert(spy.calledOnce);
    });

    it('can take a single descrip filter', function() {
      var spy = sinon.spy();
      hose.await('blue', spy);
      deposit(['red']);
      assert(spy.notCalled);
      deposit(['blue']);
      assert(spy.calledOnce);
    });

    it('can take an empty array of descrip filters', function() {
      var spy = sinon.spy();
      hose.await([], spy);
      deposit([]);
      deposit(['red']);
    });

    it('requires all descrips in array of filters to be present', function() {
      var spy = sinon.spy();
      hose.await(['red', 'blue'], spy);

      deposit(['blue']);
      assert(spy.notCalled);
      deposit(['red']);
      assert(spy.notCalled);
      deposit(['red', 'blue']);
      assert(spy.calledOnce);
    });

    it('descrip filters are order-independent', function() {
        var spy = sinon.spy();
        hose.await(['red', 'blue'], spy);
        deposit(['blue', 'red']);
        assert(spy.calledOnce);
    });

    it('descrip filters match even when extra descrips are present', function() {
        var spy = sinon.spy();
        hose.await(['red', 'blue'], spy);
        deposit(['blue', 'red', 'green']);
        assert(spy.calledOnce);
    });

  });

  describe('.awaitNext()', function() {
    var hose;

    beforeEach(function() {
      hose = new Hose(requester, poolListener, 'test-pool');
    });

    it('only triggers once (without descrip filter)', function() {
      var spy = sinon.spy();
      hose.awaitNext(spy);
      deposit([]);
      deposit([]);
      assert(spy.calledOnce);
    });

    it('only triggers once (with descrip filter)', function() {
      var spy = sinon.spy();
      hose.awaitNext(['red'], spy);
      deposit(['red']);
      deposit(['red']);
      assert(spy.calledOnce);
    });

  });

  describe('.unawait()', function() {

    var hose;

    beforeEach(function() {
      hose = new Hose(requester, poolListener, 'test-pool');
    });

    it('undoes calls to await (without descrip filters)', function() {
      var spy = sinon.spy();
      hose.await(spy);
      hose.unawait(spy);
      deposit([]);
      assert(spy.notCalled);
    });

    it('undoes calls to await (with descrip filters)', function() {
      var spy = sinon.spy();
      hose.await(['red'], spy);
      hose.unawait(spy);
      deposit(['red']);
      assert(spy.notCalled);
    });

    it('undoes calls to awaitNext (without descrip filters)', function() {
      var spy = sinon.spy();
      hose.awaitNext(spy);
      hose.unawait(spy);
      deposit([]);
      assert(spy.notCalled);
    });

    it('undoes calls to awaitNext (with descrip filters)', function() {
      var spy = sinon.spy();
      hose.awaitNext(['red'], spy);
      hose.unawait(spy);
      deposit(['red']);
      assert(spy.notCalled);
    });

  });

  describe('write-only', function() {

    var hose;

    beforeEach(function() {
      hose = new Hose(requester, poolListener, 'test-pool', Hose.WR_ONLY);
    });

    it('does not attempt to listen to pool', function() {
      assert(poolListener.addPoolListener.notCalled);
    });

    it('throws if asked to await', function() {
      assert.throws(function() {
        hose.await(function() {});
      });

    });

  });

});


