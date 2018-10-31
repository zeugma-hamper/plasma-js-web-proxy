var http = require('http');
var sockjs = require('sockjs');
let plasma = require('gelatin/lib/compat');
let gelatin = require('gelatin');
var node_static = require('node-static');
var EE = require('events').EventEmitter;

var log = require('./logger');
var Protocol = require('../protocol');
var Registrar = require('./registrar-gelatin');
var degrade = require('./degrade-gelatin');

var SERVICE_NAME = 'plasma-web-proxy';
var DEFAULT_PORT = '8000';
var DEFAULT_LOGLEVEL = 'info';
var LISTEN_START_MS = 15;

function ProxyServer(opts) {
  opts = opts || {};
  this.port = opts.port || DEFAULT_PORT;
  this.hostname = opts.hostname;
  this.logLevel = opts.logLevel || DEFAULT_LOGLEVEL;
  this.registrar = new Registrar();

  log.level = this.logLevel;

  var ACTIONS = Protocol.ACTIONS;

  var poolDeposit = function(conn, descrips, ingests, pool) {
    this.registrar.registerClientToPoke(conn, pool);
    let p = new gelatin.Protein(descrips, ingests);
    this.registrar.pokeDepositors[pool].write(p);
  }.bind(this);

  var poolListen = function(conn, pool, reqId) {
    this.registrar.registerClientToPeek(conn, pool);
    // Adds a pause before reporting pools being successfully opened. There is
    // no way to get a notification when gelatin fully forms a hose. If success
    // is reported immediately, then sometimes messages can be sent, processed,
    // and had their responses returned before the hose has fully opened. In
    // practice, this is a sufficient wait period for any local pools being
    // opened.
    //
    // See https://bugs.oblong.com/show_bug.cgi?id=19764
    setTimeout(function() {
      conn.write(JSON.stringify([true, reqId]));
    }.bind(this), LISTEN_START_MS);
  }.bind(this);

  var poolListenNth = function(conn, index, pool, reqId) {
    this.registrar.registerClientToPeekNth(conn, index, pool);
    conn.write(JSON.stringify([true, reqId]));
  }.bind(this);

  var poolNth = function(conn, index, pool) {
    plasma.nth(pool, index, function(protein) {
      var msg = Protocol.poolNthResponse(degrade(protein), reqId);
      conn.write(JSON.stringify(msg));
    });
  }.bind(this);

  var poolOldest = function(conn, reqId, pool) {
    plasma.oldest(pool, function(protein) {
      var msg = Protocol.poolOldestResponse(degrade(protein), reqId);
      conn.write(JSON.stringify(msg));
    });
  }.bind(this);

  var poolNewest = function(conn, reqId, pool) {
    plasma.newest(pool, function(protein) {
      var msg = Protocol.poolNewestResponse(degrade(protein), reqId);
      conn.write(JSON.stringify(msg));
    });
  }.bind(this);

  var poolOldestIndex = function(conn, reqId, pool) {
    plasma.oldestIndex(pool, function(index) {
      var msg = Protocol.poolOldestIndexResponse(index, reqId)
      conn.write(JSON.stringify(msg));
    });
  }.bind(this);

  var poolNewestIndex = function(conn, reqId, pool) {
    plasma.newestIndex(pool, function(index) {
      var msg = Protocol.poolNewestIndexResponse(index, reqId);
      conn.write(JSON.stringify(msg));
    });
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
        var message = JSON.parse(text);
      } catch(e) {
        log.error('Couldn\'t parse message from client "%s": "%s"', conn.id, text);
        return;
      }

      switch (message.action) {
        case ACTIONS.POOL_DEPOSIT:
          poolDeposit(conn, message.descrips, message.ingests, message.pool);
          break;
        case ACTIONS.POOL_NTH:
          poolNth(conn, message.index, message.pool);
          break;
        case ACTIONS.POOL_OLDEST:
          poolOldest(conn, message.reqId, message.pool);
          break;
        case ACTIONS.POOL_NEWEST:
          poolNewest(conn, message.reqId, message.pool);
          break;
        case ACTIONS.POOL_OLDEST_INDEX:
          poolOldestIndex(conn, message.reqId, message.pool);
          break;
        case ACTIONS.POOL_NEWEST_INDEX:
          poolNewestIndex(conn, message.reqId, message.pool);
          break;
        case ACTIONS.POOL_LISTEN:
          poolListen(conn, message.pool, message.reqId);
          break;
        case ACTIONS.POOL_UNLISTEN:
          poolUnlisten(conn, message.pool);
          break;
        case ACTIONS.POOL_LISTEN_NTH:
          poolListenNth(conn, message.index, message.pool, message.reqId);
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

  log.info('Starting %s with gelatin on %s:%s',
    SERVICE_NAME, this.hostname || '', this.port);

  server.listen(this.port, this.hostname);
}

module.exports = ProxyServer;

