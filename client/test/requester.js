var assert = require('assert');
var sinon = require('sinon');
var Requester = require('../requester');

describe('Requester', function() {

  var transport;

  beforeEach(function() {
    transport = {
      send: sinon.spy()
    };
  });

  it('calls provided callback upon connecting', function() {
    var requester = new Requester(transport);
    var spy = sinon.spy();
    requester.connect('test-pool', spy);
    var lastMessage = transport.send.lastCall.args[0];
    var data = [{}, lastMessage.reqId];
    requester.consume(data);
    assert(spy.calledOnce);
    assert.equal(spy.lastCall.args[0], data);
  });

});

