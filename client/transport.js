var SockJS = require('sockjs-client');
var _ = require('underscore');
var ee = require('events').EventEmitter;

var SOCKJS_ROUTE = 'sockjs';

function Transport() {
  this._isReady = false;
  this.emitter = new ee();
}

Transport.prototype.connect = function(baseUrl, callback) {
  if (this.sock) {
    throw new Error('Plasma transport has already been asked to connect');
  }

  if (baseUrl[baseUrl.length -1] !== '/') {
    baseUrl = baseUrl + '/';
  }

  this.sock = new SockJS(baseUrl + SOCKJS_ROUTE);

  this.sock.onopen = _.bind(function() {
    this._isReady = true;
    if (callback.call) callback();
  }, this);

  this.sock.onmessage = _.bind(function(e) {
    try {
      var data = JSON.parse(e.data);
    } catch (ex) {
      throw new Error ('Error: Unable to parse:' + e.data);
    }

    this.emitter.emit('message', data);
  }, this);

  this.sock.onclose = _.bind(function() {
    this.emitter.emit('close');
  }, this);
};

Transport.prototype.send = function(obj) {
  var str = JSON.stringify(obj);

  if (!this._isReady) {
    throw new Error('Error: Attempted to send '+ str + ' before transport was ready. Use Plasma.connect("baseurl", callback) to be notified when transport is ready.');
  }

  this.sock.send(str);
};

Transport.prototype.onMessage = function(cb) {
  this.emitter.addListener('message', cb);
};

module.exports = Transport;

