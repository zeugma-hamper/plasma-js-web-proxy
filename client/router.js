_ = require('underscore');
Protocol = require('../protocol.js');
EE = require('events').EventEmitter;
util = require('util');

// Router is a singleton that simply allows listening for proteins from a
// particular pool. It does not actually handle connected or disconnecting
// from that pool.

var Router = function() {};

util.inherits(Router, EE);

Router.prototype.consume = function(data) {
  // The protein comes in as an array.  Here we
  // 'unserialize' it into nomenclature that is
  // consistent with plasma
  var protein = Protocol.assembleProtein(data);
  var pool = protein.pool;
  this.emit('protein:' + pool, protein);
};

Router.prototype.listenToPool = function(pool, fn) {
  this.addListener('protein:' + pool, fn);
};

Router.prototype.unlistenToPool = function(pool, fn) {
  this.removeListener('protein:' + pool, fn);
};

module.exports = new Router();

