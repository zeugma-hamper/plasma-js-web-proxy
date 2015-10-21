var _ = require('underscore');

function Proxy(baseUrl, RequesterClass, TransportClass, PoolListenerClass, HoseClass) {
  this.baseUrl = baseUrl;
  this.transport = new TransportClass();
  this.requester = new RequesterClass(this.transport);
  this.listener = new PoolListenerClass(this.requester);
  this._HoseClass = HoseClass;
  this._isConnected = false;
  this._connectListeners = [];

  this.transport.onMessage(_.bind(this.consumeMessage, this));
  this.transport.connect(this.baseUrl, _.bind(this._onTransportConnect, this));
}

Proxy.prototype = {

  onConnect: function(callback) {
    if (this._isConnected) {
      callback();
    } else {
      this._connectListeners.push(callback);
    }
  },

  _onTransportConnect: function() {
    this._isConnected = true;
    _.each(this._connectListeners, function(listener) {
      listener();
    });

    this._connectListeners = [];
  },

  consumeMessage: function(data) {
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

