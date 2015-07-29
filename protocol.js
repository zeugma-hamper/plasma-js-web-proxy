var ACTIONS = {
  POOL_DEPOSIT: 'deposit',
  POOL_CREATE: 'createpool',
  POOL_STOP: 'stoppool',
  POOL_LISTEN: 'addpool',
  POOL_UNLISTEN: 'delpool',
  POOL_NTH: 'nth',
  POOL_OLDEST_INDEX: 'oldest-idx',
  POOL_NEWEST_INDEX: 'newest-idx'
};

module.exports = {

  ACTIONS: ACTIONS,

  depositPool: function(poolName, descrips, ingests) {
    return {
      action: ACTIONS.POOL_DEPOSIT,
      descrips: descrips,
      ingests: ingests,
      pool: poolName
    };
  },

  createPool: function(poolName) {
    return {
      action: ACTIONS.POOL_CREATE,
      pool: poolName
    };
  },

  stopPool: function(poolName) {
    return {
      action: ACTIONS.POOL_STOP,
      pool: poolName
    };
  },

  listenPool: function(poolName) {
    return {
      action: ACTIONS.POOL_LISTEN,
      pool: poolName,
    };
  },

  unlistenPool: function(poolName) {
    return {
      action: ACTIONS.POOL_UNLISTEN,
      data: poolName
    };
  },

  poolNth: function(poolName, index) {
    return {
      action: ACTIONS.NTH,
      data: poolName,
      index: index
    };
  },

  poolOldestIndex: function(poolName) {
    return {
      action: ACTIONS.POOL_OLDEST_INDEX,
      data: poolName
    };
  },

  poolNewestIndex: function(poolName) {
    return {
      action: ACTIONS.POOL_NEWEST_INDEX,
      data: poolName
    };
  },

  assembleProtein: function(array) {
    return {
      pool: array[0],
      index: array[1],
      timestamp: array[2],
      descrips: array[3],
      ingests: array[4]
    };
  },

  zipProtein: function(protein, meta) {
    return [
      meta.pool,
      meta.index,
      meta.timestamp,
      protein.descrips,
      protein.ingests
    ];
  }

};

