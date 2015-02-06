var events = require('../events');
var promise = require('../promise');
var util = require('../util');
var _ = require('lodash');

function Database() {

}

Database.prototype = _.create(events.ObservableObject.prototype, {

  /**
   * Initialize
   */
  init: function(options) {

    this.options = _.merge({connectionString: ''}, options);

    // create adaptor db
    this.connectionString = this.options.connectionString;
    this.adaptor = createDbAdaptor(this.connectionString);

    return this;
  },

  /**
   * Logs errors
   */
  logQueries: function(flag) {
    assert(typeof flag === 'boolean', 'Expected flag to be a boolean');
    this.adaptor.logQueries.apply(this.adaptor, flag);
  },

  /**
   * Connect to the db
   */
  connect: function() {
    return this.adaptor.connect.apply(this, arguments);
  },

  /**
   * Disconnect from the db
   */
  disconnect: function() {
    return this.adaptor.disconnect.apply(this.adaptor, arguments);
  },
});

/**
 * Gets the db engine
 */
function createDbAdaptor(connectionString) {

  // type is the start of the connection string
  // e.g. mongodb://localhost
  var type = connectionString.substring(
    0,
    connectionString.indexOf(':')
  );

  if (type === 'mongodb') {
    var engine = require('mongoose');
    return {
      db: engine,
      connection: engine.createConnection(),
      connectionString: connectionString,
      connect: connectMongoDb,
      disconnect: disconnectMongoDb,
      logQueries: function(flag) {
        this.engine.set('debug', flag);
      },
    };
  }

  else if (type === 'redis') {
    var engine = require('redis');
    return {
      db: engine,
      connectionString: connectionString,
      connect: connectRedis,
      disconnect: disconnectRedis,
      logQueries: function(flag) {
        logger.debug('LOGGING NOT SUPPORTED');
      },
    };
  }

  throw new errors.NotImplemented('DB type not supported: ' + type);
}

/**
 * Connects to the mongodb
 */
function connectMongoDb() {
  var defered = promise.defer();

  // initial listener for mongo
  var onceListener = function(err) {

    // remove initial error listener
    this.adaptor.connection.removeListener('error', onceListener);
    this.adaptor.connection.removeListener('open', onceListener);

    if (err) {
      defered.reject(err);
      return;
    }

    // register normal events
    this.adaptor.connection
      .on('error', function(err) {
        this.emit('error', err);
      }.bind(this))

      .on('reconnected', function() {
        this.emit('reconnected');
      }.bind(this))

      .on('close', function() {
        this.emit('close');
      }.bind(this));

    defered.resolve(this);
  };

  this.adaptor.connection
    .on('error', onceListener.bind(this))
    .once('open', onceListener.bind(this))
    .open(this.adaptor.connectionString);

  return defered;
}

/**
 * Disconnect mongodb
 */
function disconnectMongoDb() {
  return this.connection.close();
}

/**
 * Connects to the redis server
 */
function connectRedis() {
  var defered = promise.defer();

  var portSpecified = this.connectionString.indexOf(':')
    !== this.connectionString.lastIndexOf(':');

  var host = portSpecified
    ? this.connectionString.substring(
        this.connectionString.indexOf('redis://') + 8,
        this.connectionString.lastIndexOf(':')
      )
    : this.connectionString.substring(
        this.connectionString.indexOf('redis://') + 8
      );

  var port = portSpecified
    ? parseInt(
        this.connectionString.substring(
          this.connectionString.lastIndexOf(':')
        )
      )
    : 6379;

  // initial listener
  var onceListener = function(err) {

    // remove error listener
    this.adaptor.client.removeAllListeners('connect');
    this.adaptor.client.removeAllListeners('error');

    if (err) {
      defered.reject(err);
      return;
    }

    this.adaptor.client
      .on('connect', function() {
        this.emit('reconnected');
      }.bind(this))
      .on('error', function(err) {
        this.emit('error', err);
      }.bind(this))
      .on('end', function() {
        this.emit('close');
      }.bind(this));

    defered.resolve(this);
  }

  this.adaptor.client = this.adaptor.db.createClient(port, host, {});
  this.adaptor.client
    .on('error', onceListener.bind(this))
    .once('connect', onceListener.bind(this));

  return defered;
}

/**
 * Disconnect redis
 */
function disconnectRedis() {

}

module.exports = Database;
