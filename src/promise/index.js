var _ = require('lodash');
var Q = require('kew');
var util = require('../util');

/**
 * Promise module
 *
 * @class Promise
 */
var PromiseModule = _.merge({}, Q, {

  /**
  * Creates a new promise from an initial value
  *
  * @param {Promise|value} initial - (Optional) Initial value. It can be a
  * {@link Promise} or any initial value.
  * @return {Promise}
  */
  create: function create(initial) {
    if (_.isFunction(initial)) {
      return Q.resolve(undefined).then(initial);
    }

    return Q.resolve(initial);
  },
});

module.exports = PromiseModule;
