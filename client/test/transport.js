var assert = require('assert');
var sinon = require('sinon');
var mock = require('mock-require');

var sock;
var sockSpy = sinon.spy(function() {
  sock = {
    send: sinon.spy()
  };
  return sock;
});

// Note that if sockjs-client has already been required, this will not work
// (and the tests will use the actual sockjs client)
mock('sockjs-client', sockSpy);

describe('Transport', function() {
  var Transport;
  var transport;

  before(function() {
    Transport = require('../transport');
  });

  after(function() {
    mock.stop('sockjs-client');
  });

  describe('constructor', function() {
    it('connects to the correct url when base url doesn\'t end with slash', function() {
      var transport = new Transport('url/');
      assert.equal(sockSpy.lastCall.args[0], 'url/sockjs');
    });

    it('connects to the correct url when base url ends with slash', function() {
      var transport = new Transport('otherurl');
      assert.equal(sockSpy.lastCall.args[0], 'otherurl/sockjs');
    });
  });

  describe('on("open")', function() {
    it('runs provided callback when socket is opened', function() {
      var transport = new Transport('otherurl');
      var spy = sinon.spy();
      transport.on('open', spy);
      sock.onopen();
      assert(spy.calledOnce);
    });
  });

  describe('on("message")', function() {
    it('calls listeners when socket receives data', function() {
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      var message = { hi: 'there' };
      var transport = new Transport('');
      sock.onopen();
      transport.on('message', spy1);
      transport.on('message', spy2);
      sock.onmessage({ data: JSON.stringify(message) });
      assert.deepEqual(spy1.lastCall.args[0], message);
      assert.deepEqual(spy2.lastCall.args[0], message);
    });
  });

  describe('on("close")', function() {
    it('runs provided callback when socket is closed', function() {
      var transport = new Transport('otherurl');
      var spy = sinon.spy();
      transport.on('close', spy);
      sock.onclose();
      assert(spy.calledOnce);
    });
  });

  describe('send()', function() {
    it('sends json stringified messages over sock client', function() {
      var transport = new Transport('');
      sock.onopen();
      transport.send('foo');
      assert.equal(sock.send.lastCall.args[0], JSON.stringify('foo'));
    });

    it('queues messages and sends them once connected', function() {
      var transport = new Transport('');
      transport.send('foo');
      transport.send('bar');
      assert(sock.send.notCalled);
      sock.onopen();
      assert(sock.send.calledTwice);
      assert.equal(sock.send.firstCall.args[0], JSON.stringify('foo'));
      assert.equal(sock.send.secondCall.args[0], JSON.stringify('bar'));
    });
  });

});

