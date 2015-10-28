Protocol = require('../protocol.js');
util = require('util');
_ = require('underscore');

var STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting'
};

var PoolListener = function(requester) {
  this._requester = requester;
  this._pools = {};
  this._proteinListeners = {};
  this._connectListeners = {};
};

PoolListener.prototype.consume = function(data) {
  // The protein comes in as an array.  Here we
  // 'unserialize' it into nomenclature that is
  // consistent with plasma
  var protein = Protocol.assembleProtein(data);
  var pool = protein.pool;
  var listeners = this._proteinListeners[pool];

  if (!listeners) return;
  _.each(listeners, function(listener) {
    listener(protein);
  });
};

PoolListener.prototype.addPoolListener = function(pool, onProtein, onConnect) {
  if (!this._proteinListeners[pool]) {
    this._proteinListeners[pool] = [];
  }

  this._proteinListeners[pool].push(onProtein);

  if (this.isConnected(pool)) {
    onConnect();
  } else if (this.isConnecting(pool)) {
    this._addConnectListener(pool, onConnect);
  } else {
    this._connect(pool, onConnect);
  }
};

PoolListener.prototype.removePoolListener = function(pool, onProtein) {
  if (!this._proteinListeners[pool]) {
    return false;
  }

  var index = this._proteinListeners[pool].indexOf(onProtein);

  if (index === -1) {
    return false;
  }

  this._proteinListeners[pool].splice(index, 1);
  if (this._proteinListeners[pool].length === 0) {
    // no longer needed
    this._disconnect(pool);
  }

  return true;
};

PoolListener.prototype._onPoolConnect = function(pool) {
  this._pools[pool] = STATUS.CONNECTED;

  if (!this._connectListeners[pool]) return;

  _.each(this._connectListeners[pool], function(listener) {
    listener();
  });

  delete this._connectListeners[pool];
};

PoolListener.prototype._addConnectListener = function(pool, callback) {
  if (!this._connectListeners[pool]) {
    this._connectListeners[pool] = [];
  }
  this._connectListeners[pool].push(callback);
};

PoolListener.prototype._connect = function(pool, onConnect) {
  this._pools[pool] = STATUS.CONNECTING;
  this._addConnectListener(pool, onConnect);
  this._requester.connect(pool, _.bind(this._onPoolConnect, this, pool));
};

PoolListener.prototype._disconnect = function(pool) {
  delete this._pools[pool];
  delete this._proteinListeners[pool];
  this._requester.disconnect(pool);
}

PoolListener.prototype.isConnected = function(pool) {
  return this._pools[pool] === STATUS.CONNECTED;
};

PoolListener.prototype.isConnecting = function(pool) {
  console.log
  return this._pools[pool] === STATUS.CONNECTING;
}

module.exports = PoolListener;

