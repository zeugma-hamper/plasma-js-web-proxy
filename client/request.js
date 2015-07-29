var Routing = require('./router');
var Transport = require('./transport');
var Protocol = require('../protocol');
var _ = require('underscore');

// Server sends responses for all requests, except deposits.

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

var listeners = {};

var register = function(reqId, callback) {
  if (!listeners[reqId]) {
    listeners[reqId] = [];
  }
  listeners[reqId].push(callback);
};

var satisfy = function(reqId, data) {
  if (!listeners[reqId]) return;
  _.each(listeners[reqId], function(cb) { cb(data); });
  delete listeners[reqId];
};

var request = function(data, callback) {
  var reqID = makeUniqueId();
  data.reqId = reqID;

  if (callback) {
    register(reqID, callback);
  }

  Transport.send(data);
};

var connectedPools = {};

var Request = {};

Request.consume = function(data) {
  satisfy(data[1], data);
};

Request.Connect = function(pool, onReady) {
  if (connectedPools[pool]) return;
  connectedPools[pool] = true;
  request(Protocol.listenPool(pool), onReady);
}

Request.Disconnect = function(pool) {
  if (!connectedPools[pool]) return;
  connectedPools[pool] = false;
  request(Protocol.unlistenPool(pool), function() {});
}

Request.Deposit = function(pool, protein) {
  request(Protocol.depositPool(pool, protein.descrips, protein.ingests));
};

Request.Nth = function(pool, index, cb) {
  throw new Error('Nth not implemented');
  request(Protocol.poolNth(pool, index), function(res) {
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

Request.NewestIndex = function(pool, callback) {
  throw new Error('NewestIndex not implemented');
  return request(Protocol.poolNewestIndex(pool), callback);
};

Request.OldestIndex = function(pool, callback) {
  throw new Error('OldestIndex not implemented');
  return request(Protocol.poolOldestIndex(pool), callback);
};

Request.CreatePool = function(poolName, callback) {
  return request(Protocol.createPool(poolName), callback);
};

Request.StopPool = function(poolName, callback) {
  request(Protocol.stopPool(poolName), callback);
};

module.exports = Request;

