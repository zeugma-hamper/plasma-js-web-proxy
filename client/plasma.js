var _ = require('underscore');
var Proxy = require('./proxy');
var Requester = require('./requester');
var Transport = require('./transport');
var PoolListener = require('./pool-listener');
var Hose = require('./hose');

var Plasma = Proxy;

Plasma.createProxy = function(baseUrl) {
  return new Proxy(baseUrl, Requester, Transport, PoolListener, Hose);
};

Plasma.WR_ONLY = Hose.WR_ONLY;

// Plasma used to wrap vectors and other unsupported json types. Now, vectors
// automatically become arrays, and other types are unsupported.
Plasma.degrade = function(arg) {
  console.log('Plasma.degrade has been deprecated.');
  return arg
};

module.exports = Plasma;
global.Plasma = Plasma;

