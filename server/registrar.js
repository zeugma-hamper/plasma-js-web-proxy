var plasma = require('plasma-js-bridge');
var Protocol = require('../protocol');
var log = require('./logger');

// Helpers and bookkeeping for signing up clients to pool.  Only one peek
// process is started per pool, and can be shared between multiple clients.
// Peek processes are reaped automatically when there are no more interested
// clients.

var Registrar = function() {
  this.peekProcesses = {};
  this.poolListeners = {};
};


Registrar.prototype = {

  emit: function(pool, protein) {
    var listeners = this.poolListeners[pool];
    if (!listeners) return;
    listeners.forEach(function(conn) {
      var msg = JSON.stringify(Protocol.zipProtein(protein, {
        pool: pool,
        timestamp: Date.now(),
        index: -1
      }));
      log.debug('Protein arrived: %s', msg);
      conn.write(msg);
    });
  },

  peekExistsForPool: function(pool) {
    return !!this.peekProcesses[pool];
  },

  startPeekingPool: function(pool) {
    if (this.peekProcesses[pool]) {
      log.debug('Asked to start peeking pool "%s", but already doing so', pool);
      return false;
    }
    log.info('Starting peek on pool "%s"', pool);
    this.peekProcesses[pool] = plasma.peek(pool, function(protein) {
      this.emit(pool, protein);
    }.bind(this));
    return true;
  },

  stopPeekingPool: function(pool) {
    if (!this.peekProcesses[pool]) {
      log.debug('Asked to stop peeking pool "%s", but there\'s nothing to stop', pool);
      return false;
    }
    log.info('Stopping peek on pool "%s"', pool);
    this.peekProcesses[pool].kill();
    delete this.peekProcesses[pool];
    return true;
  },

  ensurePeekProcesses: function() {
    log.debug('Ensuring peek exists for all listened pools');
    for (var pool in this.poolListeners) {
      if (!this.peekExistsForPool(pool)) {
        this.startPeekingPool(pool);
      }
    }
  },

  cullPeekProcesses: function() {
    log.debug('Culling unused peek processes');
    for (var pool in this.peekProcesses) {
      if (!this.poolListeners[pool]) {
        this.stopPeekingPool(pool);
      }
    }
  },

  registerClientToPool: function(conn, pool) {
    log.info('Registering client "%s" to pool "%s"', conn.id, pool);
    this.poolListeners[pool] = this.poolListeners[pool] || [];
    this.poolListeners[pool].push(conn);
    this.ensurePeekProcesses();
  },

  deregisterClientFromPool: function(conn, pool, skipCull) {
    log.info('Deregistering client "%s" from pool "%s"', conn.id, pool);
    var listeners = this.poolListeners[pool];
    var removed = false;

    if (listeners) {
      var index = listeners.indexOf(conn);
      if (index > -1) {
        if (listeners.length === 1) {
          delete this.poolListeners[pool];
          if (!skipCull) this.cullPeekProcesses();
        } else {
          listeners.splice(index, 1);
        }
      }
    }

    return removed;
  },

  deregisterClientFromAllPools: function(conn) {
    for (var pool in this.poolListeners) {
      this.deregisterClientFromPool(conn, pool, true);
    }
    this.cullPeekProcesses();
  }

};

module.exports = Registrar;

