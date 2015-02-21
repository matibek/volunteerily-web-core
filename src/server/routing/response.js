var _ = require('lodash');
var authenticationMiddleware = require('../middleware/authentication');
var config = require('../../config');
var constants = require('../../../constants');
var promise = require('../../promise');
var util = require('../../util');

var api = {
  /**
   * Creates a response object to be passed to the controller
   * @param {Object} expressReq The express request object
   * @param {Object} expressRes The express result object
   * @return {Object} A result object
   */
  createResponseProxy: function(expressReq, expressRes, server) {

    // auth
    var authStrategy = _.find(server.strategies, function(s) {
      return s instanceof authenticationMiddleware.AuthenticationStrategy;
    });

    return {

      /**
       * Expose the express res
       */
      expressRes: expressRes,

      /**
       * Clears the authentication
       */
      clearCookie: function() {
        expressRes.clearCookie.apply(expressRes, arguments);
      },

      /**
       * Calls the json
       * @param {Object} model The model to render as json
       */
      json: function(model) {
        return expressRes.json.bind(expressRes, arguments);
      },

      send: function() {
        return expressRes.send.apply(expressRes, arguments);
      },

      redirect: function() {
        return expressRes.redirect.apply(expressRes, arguments);
      },

      i18n: function(key) {
        return expressRes.__(key);
      },

      /**
       * Special message to show on screen
       */
      message: {
        tip: function(message) {
          expressRes.locals.message = {
            type: 'tip',
            message: message,
          };
        },

        info: function(message) {
          expressRes.locals.message = {
            type: 'info',
            message: message,
          };
        },

        warn: function(message) {
          expressRes.locals.message = {
            type: 'warn',
            message: message,
          };
        },

        warning: function(message) {
          expressRes.locals.message = {
            type: 'warn',
            message: message,
          };
        },

        error: function(message) {
          expressRes.locals.message = {
            type: 'error',
            message: message,
          };
        },

        /**
         * Custom message type
         */
        custom: function(type, message) {
          expressRes.locals.message = {
            type: type,
            message: message,
          };
        }
      },

      /**
       * Cookie function proxy
       */
      cookie: function() {
        return expressRes.cookie.apply(expressRes, arguments);
      },

      /**
       * Status function
       */
      status: function() {
        return expressRes.status.apply(expressRes, arguments);
      },

      /**
       * Locale
       */
      setLocale: function() {
        return expressRes.setLocale.apply(expressRes, arguments);
      },

      /**
       * Calls the render and catch rendering errors
       * @param {String} view The path to the view
       * @param {Object} model The model to pass to the view
       */
      render: function(view, model, options) {

        options = _.merge({ xhrJSON: true, }, options);

        if (_.isObject(view) && !model) {
          model = view;
          view = '';
        }

        // xhr, then just return the json
        if (!view || (expressReq.xhr && options.xhrJSON)) {
          return promise.create()
            .then(function() {
              expressRes.json(model);
            });
        }

        // wrap in a model for cleanliness
        model = {
          model: model,
          query: expressReq.query,
        };

        // append other helper
        if (authStrategy) {
          var auth = authStrategy.getAuthentication(expressReq, expressRes);
          model.auth = authStrategy.toViewModel(auth);
        }

        // render the view
        return promise
          .nfcall(
            expressRes.render.bind(expressRes),
            view,
            model
          )
          .then(function(html) {
            expressRes.send(html);
          });
      },
    };
  },
};

module.exports = api;
