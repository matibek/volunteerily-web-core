var events = require('../events');
var promise = require('../promise');
var util = require('../util');
var _ = require('lodash');

var dbType = {
  mongoDb: 1,
};

function Database() {

}

Database.prototype = _.create(events.ObservableObject.prototype, {
  init: function(options) {
    this.options = this.options = _.defaults(options, {
      connectionString: '',
    });

    this.dbType = dbType.mongoDb;
    this.engine = getEngine(this.dbType);
    this.connection = this.engine.createConnection();

    return this;
  },

  logQueries: function(flag) {

    assert(typeof flag === 'boolean', 'Expected flag to be a boolean');

    // mongodb support
    this.engine.set('debug', flag);
  },

  connect: function() {

    // mongodb support
    return connectMongoDb.apply(this, arguments);
  },

  disconnect: function() {

  },
});

function getEngine(type) {

  // mongodb support
  var mongoose = require('mongoose');
  return mongoose;
}

/**
 * Connects to the mongodb
 */
function connectMongoDb() {
  var defered = promise.defer();

  var that = this;

  // initial listener for mongo
  var onceListener = function(err) {
    if (err) {
      defered.reject(err);
    }
    else {
      defered.resolve(that);
    }

    connection.removeListener('error', onceListener);

    // register normal events
    connection
      .on('error', function(err) {
        that.emit('error', err);
      })
      .on('reconnected', function() {
        that.emit('reconnected');
      })
      .on('close', function() {
        that.emit('close');
      });
  };

  var connection = this.connection
    .on('error', onceListener)
    .once('open', onceListener.bind(this));

  this.connection.open(this.options.connectionString);
  return defered;
}

module.exports = Database;
