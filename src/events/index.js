var EventEmitter = require('events').EventEmitter;
var ObservableObject = require('./observableObject');
var ObserverObject = require('./observerObject');
var util = require('../util');
var _ = require('lodash');

/**
 * Same as emit but returns the value of the listeners
 * Last one is returned
 */
function emitWithReturn(name) {

  assert(this instanceof EventEmitter,
    'Expected to be called in the context of an EventEmitter');

  var args = Array.prototype.slice.call(arguments, 1);

  return _.reduce(this.listeners(name), function(result, listener) {
    return listener.apply(null, args);
  }, {});
}

module.exports = {
  emitWithReturn: emitWithReturn,
  ObservableObject: ObservableObject,
  ObserverObject: ObserverObject,
};
