var assert = require('assert');
var sinon = require('sinon');
var mock = require('mock-require');

var sock;
var sockSpy = sinon.spy(function() {
  sock = {};
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

  beforeEach(function() {
    transport = new Transport();
  });

  after(function() {
    mock.stop('sockjs-client');
  });

  it('connects to the correct url when base url doesn\'t end with slash', function() {
    transport.connect('url/');
    assert.equal(sockSpy.lastCall.args[0], 'url/sockjs');
  });

  it('connects to the correct url when base url ends with slash', function() {
    transport.connect('otherurl');
    assert.equal(sockSpy.lastCall.args[0], 'otherurl/sockjs');
  });

  it('runs provided connect() callback when socket is opened', function() {
    var spy = sinon.spy();
    transport.connect('', spy);
    sock.onopen();
    assert(spy.calledOnce);
  });

  it('calls "onmessage" listeners when socket receives data', function(done) {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var message = { hi: 'there' };
    transport.connect('', function() {
      transport.onMessage(spy1);
      transport.onMessage(spy2);
      sock.onmessage({ data: JSON.stringify(message) });
      assert.deepEqual(spy1.lastCall.args[0], message);
      assert.deepEqual(spy2.lastCall.args[0], message);
      done();
    });
    sock.onopen();
  });

});

