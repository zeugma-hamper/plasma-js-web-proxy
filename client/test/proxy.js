var assert = require('assert');
var events = require('events');
var sinon = require('sinon');
var Proxy = require('../proxy');

describe('Proxy', function() {
  var baseUrl = 'baseurl';
  var proxy;
  var RequesterClass;
  var requester;
  var TransportClass;
  var transport;
  var PoolListenerClass;
  var listener;
  var HoseClass;

  beforeEach(function() {
    TransportClass = sinon.spy(function() {
      transport = new events.EventEmitter();
      return transport;
    });
    RequesterClass = sinon.spy(function() {
      requester = {
        consume: sinon.spy()
      };
      return requester;
    });
    PoolListenerClass = sinon.spy(function() {
      listener = {
        consume: sinon.spy(),
        setDisconnected: sinon.spy(),
        reconnectAll: sinon.spy()
      };
      return listener;
    });
    HoseClass = sinon.spy();
    proxy = new Proxy(baseUrl, RequesterClass, TransportClass, PoolListenerClass, HoseClass);
  });

  var receiveMessage = function(msg) {
    transport.emit('message', msg);
  };

  it('throws if no baseUrl is provided', function() {
    assert.throws(function() {
      proxy = new Proxy(undefined, RequesterClass, TransportClass, PoolListenerClass, HoseClass);
    });
  });

  it('creates internal objects', function() {
    assert(TransportClass.calledOnce);
    assert(RequesterClass.calledOnce);
    assert.equal(RequesterClass.lastCall.args[0], transport);
    assert(PoolListenerClass.calledOnce);
    assert.equal(PoolListenerClass.lastCall.args[0], requester);
  });

  it('returns a hose when createHose() is called', function() {
    var hose = proxy.createHose('test-pool');
    assert(HoseClass.calledOnce);
    assert.deepEqual(
      HoseClass.lastCall.args,
      [requester, listener, 'test-pool', undefined, undefined]);
  });

  it('forwards message responses to its requester', function() {
    var message = [true, {}];
    receiveMessage(message);
    assert(requester.consume.calledOnce);
  });

  it('forwards proteins to its poollistener', function() {
    var zippedProtein = ['somepool', 1, 1, [], {}];
    receiveMessage(zippedProtein);
    assert(listener.consume.calledOnce);
  });

  it('tells its pool listener when transport closes', function() {
    transport.emit('close');
    assert(listener.setDisconnected.calledOnce);
  });

  it('tells its pool listener to reconnect when transport opens', function() {
    transport.emit('close');
    transport.emit('open');
    assert(listener.reconnectAll.calledOnce);
  });

});

