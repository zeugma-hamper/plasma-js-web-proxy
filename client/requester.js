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

Requester.prototype._request = function(getData, callback) {
  var reqId = makeUniqueId();

  var data = getData(reqId);

  if (callback) {
    this.register(reqId, callback);
  }

  this.transport.send(data);
};

Requester.prototype.consume = function(data) {
  var reqId = data.reqId === undefined ? data[1] : data.reqId;
  this.satisfy(reqId, data);
};

Requester.prototype.connect = function(pool, callback) {
  this._request(function(reqId) {
    return Protocol.listenPool(pool, reqId);
  }, callback);
};

Requester.prototype.disconnect = function(pool, callback) {
  this._request(function(reqId) {
    return Protocol.unlistenPool(pool, reqId);
  }, callback);
};

Requester.prototype.Deposit = function(pool, protein, callback) {
  this._request(function(reqId) {
    return Protocol.depositPool(
      pool,
      protein.descrips,
      protein.ingests,
      reqId
    );
  }, callback);
};

Requester.prototype.Nth = function(pool, index, cb) {
  throw new Error('Nth not implemented');
  this._request(function(reqId) {
    return Protocol.poolNth(pool, index, reqId);
  }, function(res) {
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

Requester.prototype.Newest = function(pool, callback) {
  return this._request(function(reqId) {
    return Protocol.poolNewest(pool, reqId);
  }, function(data) {
    if (callback) {
      callback(data.protein);
    }
  });
};

Requester.prototype.Oldest = function(pool, callback) {
  return this._request(function(reqId) {
    return Protocol.poolOldest(pool, reqId);
  }, function(data) {
    if (callback) {
      callback(data.protein);
    }
  });
};

Requester.prototype.NewestIndex = function(pool, callback) {
  return this._request(function(reqId) {
    return Protocol.poolNewestIndex(pool, reqId);
  }, function(data) {
    if (callback) {
      callback(data.index);
    }
  });
};

Requester.prototype.OldestIndex = function(pool, callback) {
  return this._request(function(reqId) {
    return Protocol.poolOldestIndex(pool, reqId);
  }, function(data) {
    if (callback) {
      callback(data.index);
    }
  });
};

Requester.prototype.CreatePool = function(poolName, callback) {
  return this._request(function(reqId) {
    return Protocol.createPool(poolName, reqId);
  }, callback);
};

Requester.prototype.StopPool = function(poolName, callback) {
  this._request(function(reqId) {
    return Protocol.stopPool(poolName, reqId);
  }, callback);
};

module.exports = Requester;

