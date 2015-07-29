var plasma = require('plasma-js-bridge');
var Protocol = require('../protocol');
var log = require('./logger');

// Helpers and bookkeeping for signing up clients to pool.  Only one peek
// process is started per pool, and can be shared between multiple clients.
// Peek processes are reaped automatically when there are no more interested
// clients.

var peekProcesses = {};
var poolListeners = {};

var emit = function(pool, protein) {
  var listeners = poolListeners[pool];
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
};

var peekExistsForPool = function(pool) {
  return !!peekProcesses[pool];
};

var startPeekingPool = function(pool) {
  if (peekProcesses[pool]) {
    log.debug('Asked to start peeking pool "%s", but already doing so', pool);
    return false;
  }
  log.info('Starting peek on pool "%s"', pool);
  peekProcesses[pool] = plasma.peek(pool, function(protein) {
    emit(pool, protein);
  });
  return true;
};

var stopPeekingPool = function(pool) {
  if (!peekProcesses[pool]) {
    log.debug('Asked to stop peeking pool "%s", but there\'s nothing to stop', pool);
    return false;
  }
  log.info('Stopping peek on pool "%s"', pool);
  peekProcesses[pool].kill();
  delete peekProcesses[pool];
  return true;
};

var ensurePeekProcesses = function() {
  log.debug('Ensuring peek exists for all listened pools');
  for (var pool in poolListeners) {
    if (!peekExistsForPool(pool)) {
      startPeekingPool(pool);
    }
  }
};

var cullPeekProcesses = function() {
  log.debug('Culling unused peek processes');
  for (var pool in peekProcesses) {
    if (!poolListeners[pool]) {
      stopPeekingPool(pool);
    }
  }
};

var registerClientToPool = function(conn, pool) {
  log.info('Registering client "%s" to pool "%s"', conn.id, pool);
  poolListeners[pool] = poolListeners[pool] || [];
  poolListeners[pool].push(conn);
  ensurePeekProcesses();
};

var deregisterClientFromPool = function(conn, pool, skipCull) {
  log.info('Deregistering client "%s" from pool "%s"', conn.id, pool);
  var listeners = poolListeners[pool];
  var removed = false;

  if (listeners) {
    var index = listeners.indexOf(conn);
    if (index > -1) {
      if (listeners.length === 1) {
        delete poolListeners[pool];
        if (!skipCull) cullPeekProcesses();
      } else {
        listeners.splice(index, 1);
      }
    }
  }

  return removed;
};

var deregisterClientFromAllPools = function(conn) {
  for (var pool in poolListeners) {
    deregisterClientFromPool(conn, pool, true);
  }
  cullPeekProcesses();
};

module.exports = {
  registerClientToPool: registerClientToPool,
  deregisterClientFromPool: deregisterClientFromPool,
  deregisterClientFromAllPools: deregisterClientFromAllPools
};

