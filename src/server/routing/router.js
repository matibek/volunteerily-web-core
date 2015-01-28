var errors = require('../../errors');
var errorHandler = require('../middleware/errorHandler');
var express = require('express');
var promise = require('../../promise');
var request = require('./request');
var response = require('./response');
var util = require('../../util');
var _ = require('lodash');

/**
 * Router object for registering routes to the application.
 * It wraps express.Router catching all exceptions to the routing.
 * @constructor
 */
function Router(server) {
  this.expressRouter = express.Router();
  this.server = server;
}

Router.prototype = _.create(Object.prototype, {
  /**
   * Register get method
   * @param {String} path The uri path to serve
   * @param {Method}.. callback The controller callback serving the uri
   * @return {undefined}
   */
  get: function(path, callback) {
    this.expressRouter.get.apply(
      this.expressRouter,
      this._wrapCallbacks(
        arguments
      )
    );
  },

  /**
   * Register post method
   * @param {String} path The uri path to serve
   * @param {Method} callback The controller callback serving the uri
   * @return {undefined}
   */
  post: function(path, callback) {
    this.expressRouter.post.apply(
      this.expressRouter,
      this._wrapCallbacks(
        arguments
      )
    );
  },

  /**
   * Register put method
   * @param {String} path The uri path to serve
   * @param {Method} callback The controller callback serving the uri
   * @return {undefined}
   */
  put: function(path, callback) {
    this.expressRouter.put.apply(
      this.expressRouter,
      this._wrapCallbacks(
        arguments
      )
    );
  },

  /**
   * Register delete method
   * @param {String} path The uri path to serve
   * @param {Method} callback The controller callback serving the uri
   * @return {undefined}
   */
  delete: function(path, callback) {
    this.expressRouter.delete.apply(
      this.expressRouter,
      this._wrapCallbacks(
        arguments
      )
    );
  },

  /**
   * Map logic to route parameters
   */
  param: function() {
    this.expressRouter.param.apply(this.expressRouter, arguments);
  },

////////////////////////////////////////////////////////////////////////////////
// Private
////////////////////////////////////////////////////////////////////////////////

  /**
   * Wraps the arguments callback with a custom callback
   */
  _wrapCallbacks: function (args) {
    args = Array.prototype.slice.call(args, 0);

    // handle errors on the routes
    var resultHandledErrors = _.chain(args)

      // first argument is a path
      .reject(function(cb, i) {
        return i === 0;
      })

      .map(function(cb) {
        return this._handleRoute(cb);
      }, this)

      .valueOf();

    return _.union(
      [args[0]], // path
      resultHandledErrors // routes
    );
  },

  /**
   * Creates a wrapper callback but handles errors of the callback
   * @param {Method} callback The route callback
   * @return {Method} A callback wrapper
   */
  _handleRoute: function (callback) {
    var server = this.server;

    return function(req, res, next) {

      // wrap in a promise
      promise
        .create()

        // create the req/res proxy
        .then(function() {
          return promise.all([
            request.createRequestProxy(req, res, server),
            response.createResponseProxy(req, res, server)
          ]);
        })

        // call the controller
        .then(function(results) {

          logger.context('route', callback);

          return callback(
            results[0],
            results[1],
            next
          );
        })

        // catch all unhandled errors
        .fail(next)

        .end();
    };
  },
});


module.exports = Router;
