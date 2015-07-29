var _ = require('underscore');
var Request = require('./request');
var Transport = require('./transport');
var Router = require('./router');
var Hose = require('./hose');

var Plasma = {};

Plasma.ready = Transport.ready;

Transport.onMessage(function(data) {
  if (data[0] === true || data[0] === false) {
    Request.consume(data);
  } else {
    Router.consume(data);
  }
});

Plasma.Hose = Hose;
Plasma.WR_ONLY = Hose.WR_ONLY;

Plasma.Deposit = Request.Deposit;
Plasma.Nth = Request.Nth;
Plasma.NewestIndex = Request.NewestIndex;
Plasma.OldestIndex = Request.OldestIndex;

Plasma.Pool = {};
Plasma.Pool.Create = Request.CreatePool;
Plasma.Pool.Stop = Request.StopPool;

Plasma.Disconnect = Request.Disconnect;

// Plasma used to wrap vectors and other unsupported json types. Now, vectors
// automatically become arrays, and other types are unsupported.
Plasma.degrade = function(arg) {
  console.log('Plasma.degrade is a no op.');
  return arg
};

module.exports = Plasma;
global.Plasma = Plasma;

