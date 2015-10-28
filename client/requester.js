var Protocol = require('../protocol');
var _ = require('underscore');

var makeUniqueId = (function() {
  // guarantee local uniqueness
  var atomic = 0;

  return function() {
    return [
      (++atomic).toString(36),
      Math.floor(Math.random() * Math.pow(2, 32)).toString(36)
    ].join('.');
  };
})();

function Requester(transport) {
  this.transport = transport;
  this.listeners = {};

  // Autobind all prototype methods
  _.each(Requester.prototype, function(fn, fnName) {
    this[fnName] = _.bind(fn, this);
  }, this);
}

// Server sends responses for all requests, except deposits.
Requester.prototype.register = function(reqId, callback) {
  if (!this.listeners[reqId]) {
    this.listeners[reqId] = [];
  }
  this.listeners[reqId].push(callback);
};

Requester.prototype.satisfy = function(reqId, data) {
  if (!this.listeners[reqId]) return;
  _.each(this.listeners[reqId], function(cb) { cb(data); });
  delete this.listeners[reqId];
};

Requester.prototype.request = function(data, callback) {
  var reqID = makeUniqueId();
  data.reqId = reqID;

  if (callback) {
    this.register(reqID, callback);
  }

  this.transport.send(data);
};

Requester.prototype.consume = function(data) {
  this.satisfy(data[1], data);
};

Requester.prototype.connect = function(pool, onReady) {
  this.request(Protocol.listenPool(pool), onReady);
}

Requester.prototype.disconnect = function(pool) {
  this.request(Protocol.unlistenPool(pool), function() {});
}

Requester.prototype.Deposit = function(pool, protein) {
  this.request(Protocol.depositPool(pool, protein.descrips, protein.ingests));
};

Requester.prototype.Nth = function(pool, index, cb) {
  throw new Error('Nth not implemented');
  this.request(Protocol.poolNth(pool, index), function(res) {
    // The response is either of the format
    //  [true, data]
    // or
    //  [false, string]
    //
    var status = res[0];
    var data = res[1];

    if (cb) {
      if (status) {
        cb(status, data);
      } else {
        cb(status, _.isArray(data) ? Protocol.assembleProtein(data) : data);
      }
    }
  });
};

Requester.prototype.NewestIndex = function(pool, callback) {
  throw new Error('NewestIndex not implemented');
  return this.request(Protocol.poolNewestIndex(pool), callback);
};

Requester.prototype.OldestIndex = function(pool, callback) {
  throw new Error('OldestIndex not implemented');
  return this.request(Protocol.poolOldestIndex(pool), callback);
};

Requester.prototype.CreatePool = function(poolName, callback) {
  return this.request(Protocol.createPool(poolName), callback);
};

Requester.prototype.StopPool = function(poolName, callback) {
  this.request(Protocol.stopPool(poolName), callback);
};

module.exports = Requester;

