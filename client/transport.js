var SockJS = require('sockjs-client');
var _ = require('underscore');
var ee = require('events');

var ready = false;

var readyListeners = [];
var messageListeners = [];

var emitter = new ee();

var Transport = {};

// Stop brings everything down.
Transport.stop = function() {};
Transport.Stop = function() {};

Transport.ready = function(callback) {
  if (ready) {
    callback();
  } else {
    emitter.addListener('open', callback);
  }
};

var sock = new SockJS('/plasma/sockjs');

sock.onopen = function() {
  ready = true;
  emitter.emit('open');
};

sock.onmessage = function(e) {
  try {
    var data = JSON.parse(e.data);
  } catch (ex) {
    throw new Error ('Error: Unable to parse:' + e.data);
  }

  emitter.emit('message', data);
};

sock.onclose = function() {
  emitter.emit('close');
};

Transport.send = function(obj) {
  var str = JSON.stringify(obj);

  if (!ready) {
    throw new Error('Error: Attempted to send '+ str + ' before transport was ready. Use Plasma.ready() to be notified when transport is ready.');
  }

  sock.send(str);
}

Transport.onMessage = function(cb) {
  emitter.addListener('message', cb);
};

module.exports = Transport;

