var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

/**
 * Observable object class
 * @class
 */
function ObservableObject() {
  EventEmitter.call(this);
}

ObservableObject.prototype = _.create(EventEmitter.prototype, {

});

module.exports = ObservableObject;
