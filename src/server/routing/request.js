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
  createRequestProxy: function(expressReq, expressRes, server) {

    // put the authentication info
    var strategy = _.find(server.strategies, function(s) {
      return s instanceof authenticationMiddleware.AuthenticationStrategy;
    });

    if (!strategy) {
      return expressReq;
    }

    // get auth and inject in the request
    return promise.create()
      .then(function() {
        return strategy.getAuthentication(expressReq, expressRes);
      })
      .then(function(auth) {
        expressReq.auth = auth;
        return expressReq;
      });
  },

}

module.exports = api;
