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
function AuthenticationStrategy(methods) {

  // validate model
  assert(_.isFunction(methods.getAuthentication),
    'Expected a getAuthentication(req, res) method');
  assert(_.isFunction(methods.isAuthenticated),
    'Expected a isAuthenticated(req, res) method');

  this.getAuthentication = methods.getAuthentication.bind(methods);
  this.isAuthenticated = methods.isAuthenticated.bind(methods);
  this.toViewModel = _.isFunction(methods.toViewModel)
    ? methods.toViewModel.bind(methods)
    : function(model) { return model; };
}

var authStrategy;

var api = {

  /**
   * Sets a strategy
   */
  setStrategy: function(strategy, server) {

    if (!(strategy instanceof AuthenticationStrategy)) {
      return;
    }

    authStrategy = strategy;
  },

  /**
   * Verifies if the user is authenticated
   */
  requireAuthentication: function requireAuthentication(req, res, options) {
    assert(authStrategy, 'An auth strategy has not been specified');

    promise.create()
      .then(function() {
        return authStrategy.isAuthenticated(req, res);
      })
      .then(function(auth) {
        if (!auth) {
          throw new errors.Unauthorized();
        }

        options.next();
      })
      .end();
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
    AuthenticationStrategy: AuthenticationStrategy,
  },
  api
);
