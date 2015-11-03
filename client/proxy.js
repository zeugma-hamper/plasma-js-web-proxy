var _ = require('underscore');

function Proxy(baseUrl, RequesterClass, TransportClass, PoolListenerClass, HoseClass) {
  if (!baseUrl) {
    throw new Error('Proxy requires a baseUrl to connect to');
  }

  this.baseUrl = baseUrl;
  this.transport = new TransportClass(baseUrl);
  this.requester = new RequesterClass(this.transport);
  this.listener = new PoolListenerClass(this.requester);
  this._HoseClass = HoseClass;

  this.transport.on('open', _.bind(this._onTransportOpen, this));
  this.transport.on('message', _.bind(this._consumeMessage, this));
  this.transport.on('close', _.bind(this._onTransportClose, this));
}

Proxy.prototype = {

  _onTransportOpen: function() {
    this.listener.reconnectAll();
  },

  _onTransportClose: function() {
    this.listener.setDisconnected();
  },

  _consumeMessage: function(data) {
    if (data[0] === true || data[0] === false) {
      this.requester.consume(data);
    } else {
      this.listener.consume(data);
    }
  },

  createHose: function(pool, param, onReady) {
    return new this._HoseClass(this.requester, this.listener, pool, param, onReady);
  },

  deposit: function(pool, protein) {
    this.requester.Deposit(pool, protein);
  },

  nth: function() {
    this.requester.Nth.apply(this.requester, arguments);
  },

  newestIndex: function() {
    this.requester.NewestIndex.apply(this.requester, arguments);
  },

  oldestIndex: function() {
    this.requester.OldestIndex.apply(this.requester, arguments);
  },

  createPool: function() {
    this.requester.CreatePool.apply(this.requester, arguments);
  },

  stopPool: function() {
    this.requester.StopPool.apply(this.requester, arguments);
  },

  disconnect: function() {
    this.requester.Disconnect.apply(this.requester, arguments);
  }

};

module.exports = Proxy;

