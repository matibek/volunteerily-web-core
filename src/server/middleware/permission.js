var _ = require('lodash');
var constants = require('../../../constants');
var events = require('../../events');
var eventEmitter = new (require('events').EventEmitter)();
var permission = require('../../permission');
var promise = require('../../promise');
var util = require('../../util');


/**
* AuthenticationStrategy class for retrieving authentication info
*
* @class
*/
function PermissionStrategy(methods) {

  // validate model
  assert(_.isFunction(methods.getPermission),
    'Expected a getPermission(req, res) method');

  assert(_.isFunction(methods.hasPermission),
    'Expected a hasPermission(check, req, res) method');

  this.getPermission = methods.getPermission.bind(methods);
  this.hasPermission = methods.hasPermission.bind(methods);

  this.toViewModel = _.isFunction(methods.toViewModel)
    ? methods.toViewModel.bind(methods)
    : function(model) { return model; };
}

var permissionStrategy;

var api = {

  /**
   * Sets a strategy
   */
  setStrategy: function(strategy, server) {

    if (!(strategy instanceof PermissionStrategy)) {
      return;
    }

    permissionStrategy = strategy;
  },

  /**
   * Verifies the user's permission
   */
  requirePermission: function requirePermission(permissionCheck) {

    assert(permissionStrategy, 'A permission strategy has not been specified');

    return function requirePermission(req, res, next, options) {
      promise.create()
        .then(function() {
          return permissionStrategy.hasPermission(permissionCheck, req, res);
        })
        .then(function(result) {
          if (!result) {
            options.next(new errors.Unauthorized());
            return;
          }

          options.next();
        })
        .fail(function(err) {
          options.next(new errors.ServerError('Error while checking permission', err));
        })
        .done();
    };
  },
};

module.exports = _.merge(
  {
    PermissionStrategy: PermissionStrategy,
  },
  api
);
