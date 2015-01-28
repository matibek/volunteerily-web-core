var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

/**
* Observer object class
* @class
*/
function ObserverObject() {

  // remember all binded events
  // {
  //   'Post': {
  //     object: Post,
  //     eventName: 'create'
  //     handlers: [function]
  //   }
  //   ...
  // }

  this.binded = [];
}

ObserverObject.prototype = _.create(Object.prototype, {

  bind: function(obj, eventName, handler) {

    assert(
      _.isFunction(obj.addListener) &&
      _.isFunction(obj.removeListener),
      'Expected obj to implement an "addListener" and "removeListener" method'
    );

    // call eventEmiter
    var bindedHandler = handler.bind(this);
    obj.addListener(eventName, bindedHandler);

    // remember to call remove later
    this.binded.push({
      object: obj,
      eventName: eventName,
      handler: bindedHandler,
    });
  },

  unbindAll: function() {
    _.forEach(this.binded, function(value) {
      value.object.removeListener(value.eventName, value.handler);
    });
  }
});

module.exports = ObserverObject;
