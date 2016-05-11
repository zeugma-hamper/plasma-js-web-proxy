var _ = require('underscore');

// param can be Hose.WR_ONLY to only write to the pool
// and not listen in on anything.
var Hose = function(requester, poolListener, pool, param, onReady) {
  // Legacy Plasma.Hose was not a constructor
  if (!(this instanceof Hose)) {
    return new Hose(Plasma, pool, param, onReady);
  }

  if (param && param !== Hose.WR_ONLY) {
    throw new Error('Unrecognized Hose param "' + param + '"');
  }

  this.pool = pool;
  this._requester = requester;
  this._listeners = [];

  this.writeOnly = param && (param === Hose.WR_ONLY);
  // Only listen if we don't have a WR_ONLY passed in
  if (!this.writeOnly) {
    poolListener.addPoolListener(
      this.pool,
      _.bind(this.onProtein, this),
      onReady
    );
  }
};

Hose.prototype.onProtein = function(protein) {
  _.each(this._listeners, function(listener) {
    listener(protein);
  });
};

Hose.prototype.deposit = function(protein) {
  return this._requester.Deposit(this.pool, protein);
};

Hose.prototype._await = function(callback) {
  if (this.writeOnly) {
    throw new Error('Hose for pool "' + this.pool + '" was instantiated as write-only and cannot be awaited');
  }

  this._listeners.push(callback);
};

Hose.prototype._unawait = function(callback) {
  var index = this._listeners.indexOf(callback);
  if (index === -1) {
    return false;
  }
  this._listeners.splice(index, 1);
  return true;
};

// Allows user callbacks to be traced to the altered callback used for
// filtering and awaitNext'ing.
Hose.prototype._addAlteredCallback = function(srcCallback, dstCallback) {
  this._alteredCallbacks = this._alteredCallbacks || [];
  this._alteredCallbacks.push({
    src: srcCallback,
    dst: dstCallback
  });
};

Hose.prototype._pullAlteredCallback = function(srcCallback) {
  if (!this._alteredCallbacks) return undefined;

  var itemIndex =  _.findIndex(this._alteredCallbacks, function(item) {
    return item.src === srcCallback;
  });

  if (itemIndex !== -1) {
    return this._alteredCallbacks.splice(itemIndex, 1)[0].dst;
  } else {
    return undefined;
  }
};

Hose.prototype.await = function(matchDescrips, callback) {
  if (arguments.length === 1) {
    return this._await(matchDescrips);
  }

  if (!matchDescrips || matchDescrips.length === 0) {
    return this._await(callback);
  }

  if (!_.isArray(matchDescrips)) {
    matchDescrips = [matchDescrips];
  }

  var filterCallback = function(protein) {
    var doesMatch = _.every(matchDescrips, function(matchDescrip) {
      return _.contains(protein.descrips, matchDescrip);
    });

    if (doesMatch) {
      callback(protein);
    }
  };

  this._addAlteredCallback(callback, filterCallback);
  this._await(filterCallback);
};

Hose.prototype.awaitNext = function(matchDescrips, callback) {
  var that = this;
  var cb = arguments.length === 1 ? matchDescrips : callback;

  var deregCallback = function(protein) {
    cb(protein);
    that.unawait(deregCallback);
  };

  this._addAlteredCallback(cb, deregCallback);
  this.await(matchDescrips, deregCallback);
};

Hose.prototype.unawait = function(callback) {
  var alteredCallback = this._pullAlteredCallback(callback);

  if (alteredCallback) {
    // await was called with filters and/or awaitNext
    return this.unawait(alteredCallback);
  } else {
    return this._unawait(callback);
  }
};

Hose.prototype.newestIndex = function(callback) {
  this._requester.NewestIndex(this.pool, callback);
};

Hose.prototype.oldestIndex = function(callback) {
  this._requester.OldestIndex(this.pool, callback);
};

Hose.prototype.newest = function(callback) {
  this._requester.Newest(this.pool, callback);
};

Hose.prototype.oldest = function(callback) {
  this._requester.Oldest(this.pool, callback);
};

// Hose.prototype.nth = function(index, callback) {
//   this._requester.nth(this.pool, index, callback);
// };


// Legacy
Hose.prototype.Deposit = Hose.prototype.deposit;
Hose.prototype.Await = Hose.prototype.await;
Hose.prototype.AwaitNext = Hose.prototype.awaitNext;
Hose.prototype.unAwait = Hose.prototype.unawait;

Hose.WR_ONLY = 'WR_ONLY';

module.exports = Hose;

