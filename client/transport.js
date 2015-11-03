var SockJS = require('sockjs-client');
var _ = require('underscore');
var events = require('events');

var SOCKJS_ROUTE = 'sockjs';

function Transport(baseUrl) {
  this._isOpen = false;
  this._queue = [];
  this._numConnects = 0;

  if (baseUrl[baseUrl.length -1] !== '/') {
    baseUrl = baseUrl + '/';
  }

  this._baseUrl = baseUrl;
  this._reconnectDelay = 1500;
  this._start();
};

_.extend(Transport.prototype, events.EventEmitter.prototype);

Transport.prototype._start = function() {
  this._sock = new SockJS(this._baseUrl + SOCKJS_ROUTE);
  this._sock.onopen = _.bind(this._onSockOpen, this);
  this._sock.onmessage = _.bind(this._onSockMessage, this);
  this._sock.onclose = _.bind(this._onSockClose, this);
};

Transport.prototype._onSockOpen = function() {
  this._numConnects += 1;
  this._isOpen = true;
  this.emit('open');
  this._flushQueue();
};

Transport.prototype._onSockMessage = function(e) {
  try {
    var data = JSON.parse(e.data);
  } catch (ex) {
    throw new Error ('Error: Unable to parse:' + e.data);
  }

  this.emit('message', data);
};

Transport.prototype.send = function(obj) {
  if (!this._isOpen) {
    this._queue.push(obj);
    return;
  }

  var str = JSON.stringify(obj);
  this._sock.send(str);
};

Transport.prototype._onSockClose = function() {
  this._isOpen = false;
  this.emit('close');
  setTimeout(_.bind(this._start, this), this._reconnectDelay);
};

Transport.prototype._flushQueue = function() {
  _.each(this._queue, this.send, this);
  this._queue = [];
};

module.exports = Transport;

