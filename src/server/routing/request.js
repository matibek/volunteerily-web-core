var _ = require('lodash');
var authenticationMiddleware = require('../middleware/authentication');
var config = require('../../config');
var constants = require('../../../constants');
var permissionMiddleware = require('../middleware/permission');
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

    // put the authentication info and permission
    var authStrategy = _.find(server.strategies, function(s) {
      return s instanceof authenticationMiddleware.AuthenticationStrategy;
    });

    var permissionStrategy = _.find(server.strategies, function(s) {
      return s instanceof permissionMiddleware.PermissionStrategy;
    });

    if (!authStrategy && !permissionStrategy) {
      return expressReq;
    }

    // get auth and inject in the request
    return promise.all([
      authStrategy ? authStrategy.getAuthentication(expressReq, expressRes) : null,
      permissionStrategy ? permissionStrategy.getPermission(expressReq, expressRes) : null,
    ])
      .then(function(results) {
        var auth = results[0];
        var permission = results[1];

        if (auth) {
          expressReq.auth = auth;
        }

        if (permission) {
          expressReq.permission = permission;
        }

        return expressReq;
      })

      // inject helper
      .then(function(req) {        
        req.isMobile = server.mobileUrl && (server.mobileUrl.hostname === expressReq.hostname);
        return req;
      });
  },

}

module.exports = api;
