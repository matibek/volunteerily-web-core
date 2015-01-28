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

  this.getPermission = methods.getPermission.bind(methods);

  this.byPassPermission = function() {
    if (!_.isFunction(methods.byPassPermission)) {
      return false;
    }

    return methods.byPassPermission.apply(methods, arguments);
  };
}

/**
 * checks the permission against a value
 */
function proceedPermissionCheck(next, userPermission, permissionCheck, key) {

  if (!userPermission) {
    throw new errors.Unauthorized();
  }

  var code = userPermission.getPermission(key, permissionCheck.context);
  if (!permission.hasPermission(code, permissionCheck.value)) {
    throw new errors.Unauthorized();
  }

  next();
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
  requirePermission: function requirePermission(permissionCheck, path) {

    assert(permissionStrategy, 'An auth strategy has not been specified');

    return function requirePermission(req, res, next) {

      return promise.create()
        .then(function() {
          return permissionStrategy.byPassPermission(req, res, permissionCheck, path);
        })
        .then(function(bypass) {

          // bypassed by strategy
          if (bypass) {
            next();
            return;
          }

          // handle as a general permission
          if (!path) {
            return promise
              .create(permissionStrategy.getPermission(req, res))
              .then(function(userPermission) {
                proceedPermissionCheck(next, userPermission, permissionCheck);
              });
          }

          // handle as a context with custom extraction
          if (_.isFunction(path)) {
            return promise
              .all([
                permissionStrategy.getPermission(req, res),
                path(req, res)
              ])
              .then(function(results) {
                var userPermission = results[0];
                var value = results[1];

                proceedPermissionCheck(
                  next,
                  userPermission,
                  permissionCheck,
                  value
                );
              });
          }

          // handle as a context
          if (typeof path === 'string') {

            // support object navigation e.g. org._id
            var value = util.object.get(req.param.bind(req), path);

            return promise
              .create(permissionStrategy.getPermission(req, res))
              .then(function(userPermission) {
                proceedPermissionCheck(
                  next,
                  userPermission,
                  permissionCheck,
                  value
                );
              });
          }

          logger.warning('Unhandled requirePermission');
        });
    };
  },

  // /**
  //  * Event hook
  //  */
  // on: function() {
  //   eventEmitter.on.apply(eventEmitter, arguments);
  // },

};

module.exports = _.merge(
  {
    PermissionStrategy: PermissionStrategy,
  },
  api
);
