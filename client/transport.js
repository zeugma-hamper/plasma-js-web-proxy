var SockJS = require('sockjs-client');
var _ = require('underscore');
var ee = require('events').EventEmitter;

var SOCKJS_ROUTE = 'sockjs';

function Transport(baseUrl, connectCallback) {
  this._isReady = false;
  this._emitter = new ee();
  this._queue = [];

  if (connectCallback && connectCallback.call) {
    this._connectCallback = connectCallback;
  }

  if (baseUrl[baseUrl.length -1] !== '/') {
    baseUrl = baseUrl + '/';
  }

  this._sock = new SockJS(baseUrl + SOCKJS_ROUTE);

  this._sock.onopen = _.bind(this._onSockOpen, this);
  this._sock.onmessage = _.bind(this._onSockMessage, this);
  this._sock.onclose = _.bind(this._onSockClose, this);
};

Transport.prototype._onSockOpen = function() {
  this._isReady = true;
  this._flushQueue();
  if (this._connectCallback) this._connectCallback();
};

Transport.prototype._onSockMessage = function(e) {
  try {
    var data = JSON.parse(e.data);
  } catch (ex) {
    throw new Error ('Error: Unable to parse:' + e.data);
  }

  this._emitter.emit('message', data);
};

Transport.prototype.send = function(obj) {
  if (!this._isReady) {
    this._queue.push(obj);
    return;
  }

  var str = JSON.stringify(obj);
  this._sock.send(str);
};

Transport.prototype._onSockClose = function() {
  this._emitter.emit('close');
};

Transport.prototype._flushQueue = function() {
  _.each(this._queue, this.send, this);
  this._queue = [];
};

Transport.prototype.onMessage = function(cb) {
  this._emitter.addListener('message', cb);
};

module.exports = Transport;

