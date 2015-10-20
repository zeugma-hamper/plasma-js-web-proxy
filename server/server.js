var http = require('http');
var sockjs = require('sockjs');
var plasma = require('plasma-js-bridge');
var node_static = require('node-static');
var EE = require('events').EventEmitter;

var log = require('./logger');
var Protocol = require('../protocol');
var Registrar = require('./registrar');

var SERVICE_NAME = 'plasma-web-proxy';
var DEFAULT_PORT = '8000';
var DEFAULT_HOST = 'localhost';
var DEFAULT_LOGLEVEL = 'info';

function ProxyServer(opts) {
  opts = opts || {};
  this.port = opts.port || DEFAULT_PORT;
  this.hostname = opts.host || DEFAULT_HOST;
  this.logLevel = opts.logLevel || DEFAULT_LOGLEVEL;
  this.registrar = new Registrar();

  log.level = this.logLevel;

  var ACTIONS = Protocol.ACTIONS;

  var poolDeposit = function(conn, descrips, ingests, pool) {
    plasma.poke(descrips, ingests, pool);
  };

  var poolListen = function(conn, pool) {
    this.registrar.registerClientToPool(conn, pool);
    conn.write(JSON.stringify([true, message.reqId]));
  }.bind(this);

  var poolUnlisten = function(conn, pool) {
    this.registrar.deregisterClientFromPool(conn, pool);
  }.bind(this);

  var sockServer = sockjs.createServer();

  sockServer.on('connection', function(conn) {
    log.info('Client "%s" connected', conn.id);
    conn.on('data', function(text) {
      log.debug('Client message received:', text);
      try {
        message = JSON.parse(text);
      } catch(e) {
        log.error('Couldn\'t parse message from client "%s": "%s"', conn.id, text);
        return;
      }

      switch (message.action) {
        case ACTIONS.POOL_DEPOSIT:
          poolDeposit(conn, message.descrips, message.ingests, message.pool);
          break;
        case ACTIONS.POOL_LISTEN:
          poolListen(conn, message.pool);
          break;
        case ACTIONS.POOL_UNLISTEN:
          poolUnlisten(conn, message.pool);
          break;
        default:
          log.warn('Unknown message type "%s" for "%s"', message.action, text);
      }
    });

    conn.on('close', function() {
      log.info('Client "%s" disconnected', conn.id);
      this.registrar.deregisterClientFromAllPools(conn);
    }.bind(this));
  }.bind(this));

  var static_directory = new node_static.Server(__dirname + '/../public');

  var server = http.createServer();

  server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
  });

  server.addListener('upgrade', function(req,res){
    res.end();
  });

  sockServer.installHandlers(server, {prefix:'/sockjs'});

  log.info('Starting %s on %s:%s', SERVICE_NAME, this.hostname, this.port);

  server.listen(this.port, this.hostname);
}

module.exports = ProxyServer;

