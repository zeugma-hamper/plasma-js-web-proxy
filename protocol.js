var ACTIONS = {
  POOL_DEPOSIT: 'deposit',
  POOL_CREATE: 'createpool',
  POOL_STOP: 'stoppool',
  POOL_LISTEN: 'addpool',
  POOL_UNLISTEN: 'delpool',
  POOL_NTH: 'nth',
  POOL_OLDEST: 'oldest',
  POOL_NEWEST: 'newest',
  POOL_OLDEST_INDEX: 'oldest-idx',
  POOL_NEWEST_INDEX: 'newest-idx'
};

module.exports = {

  ACTIONS: ACTIONS,

  depositPool: function(poolName, descrips, ingests, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_DEPOSIT,
      descrips: descrips,
      ingests: ingests,
      pool: poolName
    };
  },

  createPool: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_CREATE,
      pool: poolName
    };
  },

  stopPool: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_STOP,
      pool: poolName
    };
  },

  listenPool: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_LISTEN,
      pool: poolName,
    };
  },

  unlistenPool: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_UNLISTEN,
      pool: poolName
    };
  },

  poolNth: function(poolName, index, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NTH,
      data: poolName,
      index: index
    };
  },

  poolNthResponse: function(protein, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NTH,
      protein: protein,
    };
  },

  poolOldest: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_OLDEST,
      pool: poolName
    };
  },

  poolOldestResponse: function(protein, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_OLDEST,
      protein: protein
    };
  },

  poolNewest: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NEWEST,
      pool: poolName
    };
  },

  poolNewestResponse: function(protein, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NEWEST,
      protein: protein
    };
  },

  poolOldestIndex: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_OLDEST_INDEX,
      pool: poolName
    };
  },

  poolOldestIndexResponse: function(index, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_OLDEST_INDEX,
      index: index
    };
  },

  poolNewestIndex: function(poolName, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NEWEST_INDEX,
      pool: poolName
    };
  },

  poolNewestIndexResponse: function(index, reqId) {
    return {
      reqId: reqId,
      action: ACTIONS.POOL_NEWEST_INDEX,
      index: index
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
      (protein ? protein.descrips : []),
      (protein ? protein.ingests : {})
    ];
  }

};

