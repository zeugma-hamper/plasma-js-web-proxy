let gelatin = require('gelatin');
var Protocol = require('../protocol');
var log = require('./logger');
var degrade = require('./degrade-gelatin');

// Helpers and bookkeeping for signing up clients to pools. Only one poke
// process is started per pool, and can be shared between multiple clients.
// Similarly, only one peek process is started per pool, and can be shared
// between multiple clients. Peek processes are reaped automatically when there
// are no more interested clients.
// In `peek --seekto-index` instances, we cannot share between clients, but we
// still need to cleanup automatically when the client leaves

var Registrar = function() {
  // peekProcesses maps poolname => gelatin.peek
  this.peekProcesses = {};
  // peekListeners maps poolname => connection list
  this.peekListeners = {};
  // seekNthProcesses maps connection id => gelatin.peek list
  this.seekNthProcesses = {};
  // pokeDepositors maps poolname => gelatin.depositor
  this.pokeDepositors = {};
  // pokeListeners maps poolname => connection list
  this.pokeListeners = {};
};


Registrar.prototype = {

  emit: function(pool, protein) {
    var listeners = this.peekListeners[pool];
    if (!listeners) return;
    listeners.forEach(function(conn) {
      var msg = JSON.stringify(Protocol.zipProtein(degrade(protein), {
        pool: pool,
        timestamp: Date.now(),
        index: -1
      }));
      log.debug('Protein arrived: %s', msg);
      conn.write(msg);
    });
  },

  emitNth: function(conn, pool, protein) {
    if (!conn) return;
    var msg = JSON.stringify(Protocol.zipProtein(degrade(protein), {
      pool: pool,
      timestamp: Date.now(),
      index: -1
    }));
    log.debug('Protein arrived: %s', msg);
    conn.write(msg);
  },

  peekExistsForPool: function(pool) {
    return !!this.peekProcesses[pool];
  },

  pokeExistsForPool: function(pool) {
    return !!this.pokeDepositors[pool];
  },

  startPeekingPool: function(pool) {
    if (this.peekProcesses[pool]) {
      log.debug('Asked to start peeking pool "%s", but already doing so', pool);
      return false;
    }
    log.info('Starting peek on pool "%s"', pool);
    this.peekProcesses[pool] = gelatin.peek(pool);
    this.peekProcesses[pool].on('data', function (protein) {
      if (protein) {
        this.emit(pool, protein);
      }
    }.bind(this));
    this.peekProcesses[pool].on('error', (err) => {
      log.error('peek error');
      log.error(err);
    });

    return true;
  },

  startPokingPool: function(pool) {
    if (this.pokeDepositors[pool]) {
      log.debug('Asked to start poking pool "%s", but already doing so',
        pool);
      return false;
    }
    log.info('Starting poke depositor on pool "%s"', pool);
    this.pokeDepositors[pool] = gelatin.depositor(pool);
    return true;
  },

  stopPeekingPool: function(pool) {
    if (!this.peekProcesses[pool]) {
      log.debug('Asked to stop peeking pool "%s", but there\'s nothing to stop',
        pool);
      return false;
    }
    log.info('Stopping peek on pool "%s"', pool);
    this.peekProcesses[pool].end();
    delete this.peekProcesses[pool];
    return true;
  },

  stopPokingPool: function(pool) {
    if (!this.pokeDepositors[pool]) {
      log.debug('Asked to stop poking pool "%s", but there\'s nothing to stop',
        pool);
      return false;
    }
    log.info('Stopping poke on pool "%s"', pool);
    delete this.pokeDepositors[pool];
    return true;
  },

  stopPeekingConnection: function(connid) {
    if (!this.seekNthProcesses[connid]) {
      log.debug(
        'Asked to stop peeking connection "%s", but there\'s nothing to stop',
        connid);
      return false;
    }
    log.info('Stopping %d peek(s) on client "%s"',
             this.seekNthProcesses[connid].length, connid);
    delete this.seekNthProcesses[connid];
    return true;
  },

  ensurePeekProcesses: function() {
    log.debug('Ensuring peek exists for all listened pools');
    for (var pool in this.peekListeners) {
      if (!this.peekExistsForPool(pool)) {
        this.startPeekingPool(pool);
      }
    }
  },

  ensurePokeProcesses: function() {
    log.debug('Ensuring poke exists for all connected poke pools');
    for (var pool in this.pokeListeners) {
      if (!this.pokeExistsForPool(pool)) {
        this.startPokingPool(pool);
      }
    }
  },

  cullPeekProcesses: function() {
    log.debug('Culling unused peek processes');
    for (var pool in this.peekProcesses) {
      if (!this.peekListeners[pool]) {
        this.stopPeekingPool(pool);
      }
    }
    for (var connid in this.seekNthProcesses) {
      this.stopPeekingConnection(connid);
    }
  },

  cullPokeProcesses: function() {
    log.debug('Culling unused poke processes');
    for (var pool in this.pokeDepositors) {
      if (!this.pokeListeners[pool]) {
        this.stopPokingPool(pool);
      }
    }
  },

  registerClientToPeek: function(conn, pool) {
    this.peekListeners[pool] = this.peekListeners[pool] || [];
    if (this.peekListeners[pool].indexOf(conn) > -1) {
      log.info(
        'Client "%s" was already registered to pool "%s"',
        conn.id,
        pool);
      return;
    }
    log.info('Registering client "%s" to peek pool "%s"', conn.id, pool);
    this.peekListeners[pool].push(conn);
    this.ensurePeekProcesses();
  },

  registerClientToPoke: function(conn, pool) {
    this.pokeListeners[pool] = this.pokeListeners[pool] || [];
    if (this.pokeListeners[pool].indexOf(conn) > -1) {
      log.debug(
        'Client "%s" was already registered to pool "%s"',
        conn.id,
        pool);
      return;
    }
    log.info('Registering client "%s" to poke pool "%s"', conn.id, pool);
    this.pokeListeners[pool].push(conn);
    this.ensurePokeProcesses();
  },

  registerClientToPeekNth: function(conn, index, pool) {
    log.info('Registering client "%s" to peek pool "%s" at index %d',
             conn.id, pool, index);
    this.seekNthProcesses[conn.id] = this.seekNthProcesses[conn.id] || [];
    var proc = gelatin.peek(pool,{'_peekArgs': '--seekto-index='+index});
    proc.on('data', function (protein) {
      if (protein) {
        this.emitNth(conn, pool, protein);
      }
    }.bind(this));
    proc.on('error', (err) => {
      log.error('peek error');
      log.error(err);
    });
    this.seekNthProcesses[conn.id].push(proc);
  },

  deregisterClientFromPool: function(conn, pool, skipCull) {
    log.info('Deregistering client "%s" from pool "%s"', conn.id, pool);
    var listeners = this.peekListeners[pool];
    var depositors = this.pokeListeners[pool];

    if (listeners) {
      var index = listeners.indexOf(conn);
      if (index > -1) {
        if (listeners.length === 1) {
          log.info('Deregistering last peek for "%s"', pool);
          delete this.peekListeners[pool];
          if (!skipCull) this.cullPeekProcesses();
        } else {
          listeners.splice(index, 1);
        }
      }
    }
    if (depositors) {
      var index = depositors.indexOf(conn);
      if (index > -1) {
        if (depositors.length === 1) {
          log.info('Deregistering last poke for "%s"', pool);
          delete this.pokeDepositors[pool];
          if (!skipCull) this.cullPokeProcesses();
        } else {
          depositors.splice(index, 1);
        }
      }
    }
  },

  deregisterClientFromAllPools: function(conn) {
    for (var pool in this.peekListeners) {
      this.deregisterClientFromPool(conn, pool, true);
    }
    for (var pool in this.pokeDepositors) {
      this.deregisterClientFromPool(conn, pool, true);
    }
    this.cullPeekProcesses();
    this.cullPokeProcesses();
  }

};

module.exports = Registrar;
